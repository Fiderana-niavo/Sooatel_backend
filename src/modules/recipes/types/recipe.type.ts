export interface RecipeDetailDto {
  idIngredient: string;
  quantity: number;
  idItemUnit: string | null;
}

export interface CreateRecipeDto {
  idItem: string;
  yieldQuantity?: number;
  details: RecipeDetailDto[];
}

export interface UpdateRecipeDto {
  yieldQuantity?: number;
  details: RecipeDetailDto[];
}

export interface FlatIngredient {
  idIngredient: string;
  label: string;
  unit: string;
  totalQty: number;
  totalCost: number;
}

export interface RecipeTreeNode {
  idIngredient: string;
  label: string;
  qty: number;
  unit: string;
  cost: number;
  isProduced: boolean;
  subRecipeId?: string;
  subRecipeVersion?: number;
  children?: RecipeTreeNode[];
}

export interface RecipeAnalysis {
  tree: RecipeTreeNode;
  flatIngredients: FlatIngredient[];
  totalCost: number;
}
