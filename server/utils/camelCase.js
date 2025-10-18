function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

function keysToCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => keysToCamelCase(item));
  }
  
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key);
      result[camelKey] = keysToCamelCase(obj[key]);
      return result;
    }, {});
  }
  
  return obj;
}

module.exports = { keysToCamelCase };
