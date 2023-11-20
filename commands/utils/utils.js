function split_at_pattern(s, pattern) {
    const res = [];
    let beg = 0;
    let inString = false;

    for (let i = 0; i < s.length; i++) {
        if (s[i] === pattern && !inString) {
            res.push(s.substring(beg, i));
            beg = i + 1;
        } else if (s[i] === '"') {
            if (!inString) {
                inString = true;
            } else if (i > 0 && s[i - 1] !== '\\') {
                inString = false;
            }
        }
    }

    res.push(s.substring(beg));
    return res;
}


module.exports = {
    split_at_pattern: split_at_pattern,
  };
  