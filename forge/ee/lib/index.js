const fp = require('fastify-plugin')

module.exports = fp(async function (app, opts, done) {
    if (app.config.billing) {
        app.decorate('billing', await require('./billing').init(app))
    }
    require('./projectComms').init(app)
    require('./deviceEditor').init(app)

    if (app.license.get('tier') === 'enterprise') {
        require('./ha').init(app)
        app.decorate('sso', await require('./sso').init(app))
    }

    // Set the Team Library Feature Flag
    app.config.features.register('shared-library', true, true)

    // Set the DevOps Pipelines
    app.config.features.register('devops-pipelines', true, true)

    // Set the Custom Catalogs Flag
    app.config.features.register('customCatalogs', true, true)

    done()
})
