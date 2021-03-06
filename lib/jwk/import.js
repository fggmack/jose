const { createPublicKey, createPrivateKey, createSecretKey } = require('crypto')

const RSAKey = require('./key/rsa')
const ECKey = require('./key/ec')
const OctKey = require('./key/oct')
const base64url = require('../help/base64url')
const errors = require('../errors')
const isObject = require('../help/is_object')

const KeyObject = require('../help/key_object')
const { jwkToPem } = require('../help/key_utils')

const importable = new Set(['string', 'buffer', 'object'])

const mergedParameters = (target = {}, source = {}) => {
  return Object.assign({}, { alg: source.alg, use: source.use, kid: source.kid }, target)
}

const importKey = (key, parameters) => {
  let privateKey, publicKey, secret

  if (!importable.has(typeof key)) {
    throw new TypeError('key argument must be a string, buffer or an object')
  }

  if (parameters !== undefined && !isObject(parameters)) {
    throw new TypeError('parameters argument must be a plain object when provided')
  }

  if (key instanceof KeyObject) {
    switch (key.type) {
      case 'private':
        privateKey = key
        break
      case 'public':
        publicKey = key
        break
      case 'secret':
        secret = key
        break
      default:
    }
  } else if ('kty' in key && key.kty === 'oct') { // symmetric key <Object>
    try {
      secret = createSecretKey(base64url.decodeToBuffer(key.k))
    } catch (err) {
      if (!('k' in key)) {
        secret = { type: 'secret' }
      }
    }
    parameters = mergedParameters(parameters, key)
  } else if ('kty' in key) { // assume JWK formatted asymmetric key <Object>
    let parsedJWK
    try {
      parsedJWK = jwkToPem(key)
    } catch (err) {}
    if (parsedJWK && key.d) {
      privateKey = createPrivateKey(parsedJWK)
    } else if (parsedJWK) {
      publicKey = createPublicKey(parsedJWK)
    }
    parameters = mergedParameters(parameters, key)
  } else { // <Object> | <string> | <Buffer> passed to crypto.createPrivateKey or crypto.createPublicKey or <Buffer> passed to crypto.createSecretKey
    try {
      privateKey = createPrivateKey(key)
    } catch (err) {}
    try {
      publicKey = createPublicKey(key)
    } catch (err) {}
    try {
      secret = createSecretKey(Buffer.isBuffer(key) ? key : Buffer.from(key))
    } catch (err) {}
  }

  const keyObject = privateKey || publicKey || secret

  if (privateKey || publicKey) {
    switch (keyObject.asymmetricKeyType) {
      case 'rsa':
        return new RSAKey(keyObject, parameters)
      case 'ec':
        return new ECKey(keyObject, parameters)
      default:
        // TODO: test this branch once https://github.com/nodejs/node/pull/26319 is released
        throw new errors.JOSENotSupported('only RSA ane EC asymmetric keys are supported')
    }
  } else if (secret) {
    return new OctKey(keyObject, parameters)
  }

  throw new errors.JWKImportFailed('import failed')
}

module.exports = importKey
