import { RecipeMaster } from '../../src/shared/interfaces/recipe-master';

import { mockRecipeComplete } from './mockRecipeComplete';
import { mockRecipeIncomplete } from './mockRecipeIncomplete';

export const mockRecipeMasterActive: RecipeMaster = {
  _id: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'active',
  style: {
    "originalGravity": [
        1.048,
        1.058
    ],
    "finalGravity": [
        1.012,
        1.018
    ],
    "IBU": [
        25,
        45
    ],
    "SRM": [
        11,
        18
    ],
    "co2Volume": [
        2,
        2.5
    ],
    "_id": "5ca28639f7e5f91a1f31d7cb",
    "name": "American Amber Ale",
    "description": "Like most amber beers, American amber ale is named after the golden to amber color this American version of English pale ale exhibits. The color is derived from the use of caramel and crystal malt additions, which are roasted to provide amber beers with the color, body and flavor many beer fans have come to appreciate. Falling under the ale beer type, amber ales ferment at warmer temperatures for what is typically a much shorter amount of time than lager style beers.",
    "createdAt": "2019-04-01T21:44:25.987Z",
    "updatedAt": "2019-04-01T21:44:25.987Z"
  },
  notes: [],
  master: 'complete',
  owner: 'owner-id',
  hasActiveBatch: true,
  isPublic: true,
  recipes: [
    mockRecipeComplete,
    mockRecipeIncomplete
  ]
};
