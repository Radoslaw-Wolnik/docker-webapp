const chars = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
const CODE_LENGTH = 6;

export function createGameCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[(Math.random() * chars.length) | 0];
  }
  return code;
}
