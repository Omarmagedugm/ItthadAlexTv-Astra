export function increaseGameDifficulty(code) {
  const swap = (from, to) => {
    if (code.split(from).length !== 2) throw new Error('Missing unique difficulty target: '+from);
    code = code.replace(from, to);
  };
  // Reach running speed sooner, then keep increasing smoothly across route loops.
  swap('Wy=r=>Math.min(52,24+Math.max(0,r)/130)', 'Wy=r=>Math.min(58,24+Math.max(0,r)/110)+8*Math.log2(1+Math.max(0,r)/Uf)');
  swap('this.nextBoostAt=70', 'this.nextBoostAt=300');
  swap('this.nextBoostAt=t+165', 'this.nextBoostAt=t+420');
  return code;
}
