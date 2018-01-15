const pl = function(number) {
  // Plural function
  if (number > 1) {
    return 's';
  } else {
    return '';
  }
};

export {
  pl,
};
