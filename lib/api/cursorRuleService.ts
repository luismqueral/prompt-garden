/**
 * Cursor Rule Service
 * 
 * This service provides functionality for managing Cursor rules.
 * This service provides an interface for users to add prompts as Cursor rules
 * through a modal interface with multiple options.
 */

/**
 * Add a prompt as a Cursor rule - this no longer opens Cursor directly
 * but returns a Promise that resolves immediately to allow the UI to
 * show the modal.
 * 
 * @param promptText The text of the prompt to add as a rule
 * @returns A promise that resolves immediately
 */
export const addPromptAsCursorRule = async (promptText: string): Promise<void> => {
  try {
    // This function now simply resolves immediately
    // The actual functionality is handled in the CursorRuleModal component
    return Promise.resolve();
  } catch (error) {
    console.error('Error adding prompt as cursor rule:', error);
    return Promise.reject(error);
  }
};

/**
 * Format a prompt title as a filename
 * @param title The prompt title
 * @returns A formatted filename
 */
export const formatPromptFilename = (title?: string): string => {
  if (!title) return `cursor-rule-${new Date().getTime()}.mdc`;
  return `${title.toLowerCase().replace(/\s+/g, '-')}.mdc`;
};

export const CursorRuleService = {
  addPromptAsCursorRule,
  formatPromptFilename,
}; 