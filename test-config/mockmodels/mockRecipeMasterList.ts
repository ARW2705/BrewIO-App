import { RecipeMaster } from '../../src/shared/interfaces/recipe-master';

import { mockRecipeMasterActive } from './mockRecipeMasterActive';
import { mockRecipeMasterInactive } from './mockRecipeMasterInactive';

export const mockRecipeMasterList: Array<RecipeMaster> = [
  mockRecipeMasterActive,
  mockRecipeMasterInactive
];
