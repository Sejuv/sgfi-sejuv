/**
 * SGFI — Firebase Cloud Functions entry point
 * Este arquivo é o "main" do server/package.json para deploy no Firebase.
 *
 * Para desenvolvimento local, rode: node server/index.js
 */
const { onRequest } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2')
const app = require('./app')

// Defina a região mais próxima dos usuários (ex: southamerica-east1 para Brasil)
setGlobalOptions({ region: 'southamerica-east1', memory: '512MiB' })

/**
 * Função principal — todas as rotas /api/* são tratadas aqui.
 * URL final: https://api-<hash>-uc.a.run.app/api/...
 */
exports.api = onRequest(app)
