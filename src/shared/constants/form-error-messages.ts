export const FORM_ERROR_MESSAGES: object = {
  general: {
    name: {
      required: 'Please enter a recipe master name',
      minlength: 'Name must be at least two characters long',
      maxlength: 'Name must be less than 30 characters long'
    },
    variantName: {
      required: 'Please enter a recipe variant name',
      minlength: 'Name must be at least two characters long',
      maxlength: 'Name must be less than 30 characters long'
    },
    style: {
      required: 'Please select a style'
    },
    brewingType: {
      required: 'Please select a brewing type'
    },
    efficiency: {
      required: 'Please enter a mash efficiency',
      min: 'Efficiency must not be below 0%',
      max: 'Efficiency must not be above 100%'
    },
    mashDuration: {
      required: 'Please enter a mash duration',
      min: 'Please enter a non-negative number',
    },
    boilDuration: {
      required: 'Please enter a boil duration',
      min: 'Please enter a non-negative number',
    },
    batchVolume: {
      required: 'Please enter a batch volume',
      min: 'Please enter a non-negative number',
    },
    boilVolume: {
      required: 'Please enter a boil volume',
      min: 'Please enter a non-negative number',
    },
    mashVolume: {
      required: 'Please enter a mash volume',
      min: 'Please enter a non-negative number',
    }
  },
  ingredient: {
    quantity: {
      required: 'Please enter a quantity',
      min: 'Please enter a non-negative quantity',
      eitherOr: 'Please enter a quantity'
    },
    subQuantity: {
      required: 'Please enter a quantity',
      min: 'Please enter a non-negative quantity',
      eitherOr: 'Please enter a quantity'
    },
    type: {
      required: 'Please select ingredient type'
    },
    duration: {
      required: 'Please enter timeframe to add hops',
      min: 'Please enter a non-negative time',
      max: 'Hops addition may not be before start of boil'
    },
    name: {
      required: 'Please enter an ingredient name',
      minlength: 'Please enter a name with two or more characters',
      maxlength: 'Please enter a name with no more than 20 characters'
    },
    description: {
      required: 'Please enter an ingredient description',
      minlength: 'Please enter a description with two or more characters',
      maxlength: 'Please enter a description with no more than 120 characters'
    },
    units: {
      required: 'Please enter an ingredient units',
      minlength: 'Please enter a units with at least one characters',
      maxlength: 'Please enter a units with no more than 20 characters'
    }
  },
  inventory: {
    currentQuantity: {
      required: 'Please enter a current quantity'
    },
    description: {
      maxlength: 'Please enter a description with no more than 120 characters'
    },
    initialQuantity: {
      required: 'Please enter an initial quantity'
    },
    itemABV: {
      required: 'Please enter an ABV',
      min: 'Please enter a non-negative ABV'
    },
    itemName: {
      required: 'Please enter an inventory item name',
      minlength: 'Please enter an inventory item name with two or more characters',
      maxlength: 'Please enter an inventory item name with no more than 20 characters'
    },
    itemStyleId: {
      required: 'Please select a style'
    },
    sourceType: {
      required: 'Please select a source type'
    },
    stockType: {
      required: 'Please select a stock type'
    },
    supplierName: {
      required: 'Please enter a supplier name',
      minlength: 'Please enter an inventory item name with two or more characters',
      maxlength: 'Please enter an inventory item name with no more than 50 characters'
    },
    itemSubname: {
      minlength: 'Please enter an inventory item sub name with two or more characters',
      maxlength: 'Please enter an inventory item sub name with no more than 20 characters'
    },
    itemIBU: {
      min: 'Please enter a non-negative IBU'
    },
    itemSRM: {
      min: 'Please enter a non-negative SRM'
    }
  },
  process: {
    name: {
      required: 'Please enter a step name',
      minlength: 'Please enter a step name with two or more characters',
      maxlength: 'Please enter a step name with no more than 25 characters'
    },
    description: {
      maxlength: 'Please enter a description with no more than 240 characters'
    },
    duration: {
      required: 'Please enter a duration timeframe',
      min: 'Please enter a non-negative value'
    }
  },
  measurements: {
    originalGravity: {
      required: 'Please enter an original gravity value',
      min: 'Please enter a non-negative value'
    },
    finalGravity: {
      required: 'Please enter a final gravity value',
      min: 'Please enter a non-negative value'
    },
    batchVolume: {
      required: 'Please enter a batch volume',
      min: 'Please enter a non-negative value'
    }
  },
  signup: {
    username: {
      required: 'Username is required',
      minlength: 'Username must be at least 6 characters',
      maxlength: 'Username is limited to 20 characters'
    },
    password: {
      required: 'Password is required',
      minlength: 'Password must be at least 8 characters',
      maxlength: 'Password is limited to 20 characters',
      passwordInvalid: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    },
    passwordConfirmation: {
      required: 'Please confirm password',
      mismatch: 'Passwords must match'
    },
    email: {
      required: 'Email address is required',
      email: 'Email address is invalid'
    },
    firstname: {
      maxlength: 'First name is limited to 25 characters'
    },
    lastname: {
      maxlength: 'Last name is limited to 25 characters'
    }
  }
};
