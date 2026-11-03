import { supabase } from '../supabase';
import { Player, PlayerPosition } from '../types';
import { sanitizeForFirestore } from '../utils/sanitize';

export interface ParsedRosterPlayer {
  name: string;
  teamId: string;
  position: PlayerPosition;
  price: number;
}

export const parseRosterText = (teamId: string, text: string): ParsedRosterPlayer[] => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('No input roster data provided.');

  return lines.map((line, idx) => {
    const lineNum = idx + 1;
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 2) {
      throw new Error(`Error Line ${lineNum}: Format must be "[Player Name], [Position], [Fantasy Price in Millions]"`);
    }

    const [name, posStr, priceStr] = parts;
    if (!name) throw new Error(`Error Line ${lineNum}: Missing player name.`);

    let position: PlayerPosition = 'MID';
    const cleanPos = posStr.toLowerCase();
    if (cleanPos.includes('goalkeeper') || cleanPos === 'gk') position = 'GK';
    else if (cleanPos.includes('defender') || cleanPos === 'def') position = 'DEF';
    else if (cleanPos.includes('midfielder') || cleanPos === 'mid') position = 'MID';
    else if (cleanPos.includes('forward') || cleanPos.includes('striker') || cleanPos === 'fwd' || cleanPos === 'att') position = 'FWD';
    else throw new Error(`Error Line ${lineNum}: Unknown position "${posStr}". Expected Goalkeeper, Defender, Midfielder, or Forward.`);

    let price = 6.0;
    if (priceStr) {
      const pVal = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      if (isNaN(pVal) || pVal <= 0) {
        throw new Error(`Error Line ${lineNum}: Invalid price "${priceStr}". Must be a positive number.`);
      }
      price = Number(pVal.toFixed(1));
    }

    return {
      name,
      teamId,
      position,
      price
    };
  });
};

/**
 * Bulk upload player roster to Supabase using batch upsert.
 */
export const bulkUploadRosterToSupabase = async (
  teamId: string,
  rosterText: string
): Promise<{ importedCount: number; players: Player[] }> => {
  const parsedPlayers = parseRosterText(teamId, rosterText);
  if (parsedPlayers.length === 0) {
    throw new Error('No valid players found to upload.');
  }

  const createdPlayers: Player[] = [];
  const payloadToInsert: Player[] = [];

  for (let i = 0; i < parsedPlayers.length; i++) {
    const playerItem = parsedPlayers[i];
    const fullPlayer: Player = {
      id: `p-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      name: playerItem.name,
      teamId: playerItem.teamId,
      position: playerItem.position,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      cupGoals: 0,
      cupAssists: 0,
      cupCleanSheets: 0,
      shirtNumber: Math.floor(Math.random() * 89) + 10,
      price: playerItem.price,
      currentPrice: playerItem.price,
      photoUrl: '',
      isSuspended: false,
      isInjured: false,
      injuryStatus: 'Fit'
    };

    payloadToInsert.push(sanitizeForFirestore(fullPlayer));
    createdPlayers.push(fullPlayer);
  }

  const { error } = await supabase
    .from('players')
    .upsert(payloadToInsert, { onConflict: 'id' });

  if (error) {
    console.error('Supabase batch upsert failed during bulk roster upload:', error);
    const codeStr = error.code ? `[${error.code}] ` : '';
    const msgStr = error.message || 'Unknown Supabase error';
    throw new Error(`Supabase Roster Bulk Upload Failed: ${codeStr}${msgStr}`);
  }

  return {
    importedCount: createdPlayers.length,
    players: createdPlayers
  };
};

export const bulkUploadRosterToFirestore = bulkUploadRosterToSupabase;
