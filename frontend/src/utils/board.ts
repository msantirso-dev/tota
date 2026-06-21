import type { AACButton, Board, Category } from '../types'

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
}

export function sortButtons(buttons: AACButton[]): AACButton[] {
  return [...buttons].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
}

export function normalizeBoard(board: Board): Board {
  return {
    ...board,
    categories: sortCategories(board.categories),
    buttons: sortButtons(board.buttons),
  }
}

export const BOARD_STORAGE_KEY = 'tota_active_board_id'
