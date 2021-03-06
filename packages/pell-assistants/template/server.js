'use strict';

const Hapi = require('hapi');
const Good = require('good');
const Crypto = require('crypto');
const Pkg = require('./package.json');

const Server = new Hapi.Server();
const HapiConfig = {};

HapiConfig.port = 3003;

if (Pkg.pell.label){
    HapiConfig.labels = [Pkg.pell.label];
}

Server.connection(HapiConfig);

Server.register([
    {
        register: Good,
        options: {
            reporters: {
                console: [{
                    module: 'good-squeeze',
                    name: 'Squeeze',
                    args: [{
                        response: '*',
                        log: '*'
                    }]
                }, {
                    module: 'good-console'
                }, 'stdout']
            }
        }
    },
    {
        register: require('pell-assistants/extensions/swarm'),
        options: {
            id: Pkg.pell.name,
            dns: {
                domain: (Pkg.pell.dns && Pkg.pell.dns.domain) ? Pkg.pell.dns.domain : ''
            },
            dht: {
                bootstrap: [].concat(Pkg.pell.starter)
            },
            hash: false,
            port: 10002,
            maxConnections: 10
        }
    },
    {
        register: require('pell-assistants/extensions/discovery'),
        options: {
            id: Crypto.createHash('sha1').update(Pkg.pell.name).digest().toString(),
            healthChannel: Crypto.createHash('sha1').update('first_aid:status:health:*').digest().toString()
        }
    },
    {
        register: require('pell-assistants/extensions/health'),
        options: {}
    },
    {
        register: require('./index'),
        options:{}
    }
], {}, (err) => {

    if (err) {
        throw err;
    }

    Server.start((err) => {

        if (err) {
            throw err;
        }
        console.log(`Server running at: ${Server.info.uri}`);
    });
});
