
export const getChatTitle = (usernames, currentUserId) => {
  // filter out current user
  const names = usernames.filter(
    user => user.id !== currentUserId
  ).map(
    user => user.name.split(' ')[0]
  );
  const title = names.join(', ');
  return title;
};