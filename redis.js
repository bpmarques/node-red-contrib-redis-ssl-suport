module.exports = function(RED) {
    var Redis = require('ioredis');

    function RedisConfig(n) {
        RED.nodes.createNode(this, n);
        this.host = n.host;
        this.port = n.port;
        this.dbase = n.dbase;
        this.pass = n.pass;
        this.cert = n.cert ? Buffer.from(n.cert, 'base64').toString() : undefined;
    }
    RED.nodes.registerType("redis-cfg", RedisConfig);

    function RedisCmd(n) {
        RED.nodes.createNode(this, n);
        this.server = RED.nodes.getNode(n.server);
        this.command = n.command;
        this.name = n.name;
        this.topic = n.topic;
        var node = this;

        var client = connect(node.server);

        client.on('error', function(err) {
           console.log('Error');
           console.log(err);
        });

        node.on('close', function(done) {
            node.status({});
            disconnect(node.server);
            done();
        });

        node.on('input', function(msg) {
            if (!Array.isArray(msg.payload)) {
                throw Error('Payload is not Array');
            }

            client[node.command](msg.payload, function(err, res) {
                if (err) {
                    node.error(err, msg);
                }
                else {
                    msg.payload = res;
                    node.send(msg);
                }
            });
        });

    }
    RED.nodes.registerType("redis-cmd", RedisCmd);

    function _setEnv(config) {
        var result = [];
        for (var key in config) {
          result[key] = config[key];
        }
        return result;
    }

    function connect(config) {
        var config_env = _setEnv(config);
        var connectionConfig = {
            host: config_env.host,
            port: config_env.port,
            password: config_env.pass,
            db: config_env.dbase
        };
        if(config_env.cert) {
            connectionConfig['tls'] = {ca: config_env.cert};
        }

        return new Redis(connectionConfig);
    }

    function disconnect(connection) {
        connection.disconnect();
    }
};
