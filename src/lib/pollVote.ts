export function applyPollVote(poll: any, uid: string, choice: number) {
  if (!uid || !Array.isArray(poll.options) || !Number.isInteger(choice) || choice < 0 || choice >= poll.options.length) throw new Error('Invalid choice');
  const previous = poll.voterChoices?.[uid];
  if (previous === choice) return null;
  const votes = { ...poll.votes };
  const current = votes[choice] ?? 0;
  if (!Number.isSafeInteger(current) || current < 0) throw new Error('Invalid count');
  votes[choice] = current + 1;
  if (previous !== undefined) {
    if (!Number.isInteger(previous) || previous < 0 || previous >= poll.options.length || !Number.isSafeInteger(votes[previous]) || votes[previous] < 1) throw new Error('Invalid previous vote');
    votes[previous] -= 1;
  }
  return { votes, voters: [...new Set([...(poll.voters ?? []), uid])], voterChoices: { ...poll.voterChoices, [uid]: choice } };
}
