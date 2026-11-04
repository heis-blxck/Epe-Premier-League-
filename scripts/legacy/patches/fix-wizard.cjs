const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyOnboardingWizard.tsx', 'utf8');

code = code.replace(/import \{ Plus, X, Loader2, ArrowRight, Save, Trash2, Users \} from 'lucide-react';/g, "import { Plus, X, Loader2, ArrowRight, Save, Trash2, Users, Search, Shield, Check, ChevronRight } from 'lucide-react';");
code = code.replace(/remainingBudget: bank,/g, "");

fs.writeFileSync('src/components/FantasyOnboardingWizard.tsx', code);
console.log('Fixed wizard');
