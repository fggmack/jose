const RSAKey = require('./key/rsa')
const ECKey = require('./key/ec')
const OctKey = require('./key/oct')

const generate = async (kty, ...args) => {
  switch (kty) {
    case 'rsa':
    case 'RSA':
      return RSAKey.generate(...args)
    case 'ec':
    case 'EC':
      return ECKey.generate(...args)
    case 'oct':
      return OctKey.generate(...args)
    default:
      throw new TypeError('invalid key type')
  }
}

const generateSync = (kty, ...args) => {
  switch (kty) {
    case 'rsa':
    case 'RSA':
      return RSAKey.generateSync(...args)
    case 'ec':
    case 'EC':
      return ECKey.generateSync(...args)
    case 'oct':
      return OctKey.generateSync(...args)
    default:
      throw new TypeError('invalid key type')
  }
}

module.exports.generate = generate
module.exports.generateSync = generateSync
