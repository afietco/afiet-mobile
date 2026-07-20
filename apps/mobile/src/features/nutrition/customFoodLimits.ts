export const CUSTOM_FOOD_NAME_MAX_LENGTH = 80
export const CUSTOM_FOOD_DESCRIPTION_MAX_LENGTH = 280

/** Keeps programmatic Afi and stored values within the same bounds as TextInput. */
export function limitCustomFoodName(value: string): string {
  return Array.from(value).slice(0, CUSTOM_FOOD_NAME_MAX_LENGTH).join('')
}

export function limitCustomFoodDescription(value: string): string {
  return Array.from(value).slice(0, CUSTOM_FOOD_DESCRIPTION_MAX_LENGTH).join('')
}
