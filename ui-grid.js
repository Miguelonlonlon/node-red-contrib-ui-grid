module.exports = function(RED) {
    // check required configuration
    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui-grid.error.no-group"));
            return false;
        }
        return true;
    }

    // generate HTML/Angular code for ui-grid widget based on node
    // configuration.
    // Basic structure of generated code is as follows:
    //   <md-list>
    //       <md-list-item ng-repeat="item in msg.items" ...>
    //         specification of list item according to setting options
    //       </md-list-item>
    //   </md-list>
    // It uses ng-repeat of Angular in order to repeat over items in
    // a list pointed by msg.items sent from Node-RED backend.
    //
    function HTML(config) {

        var configAsJson = JSON.stringify(config);

        var html = String.raw`<input type='text' style='color:` + config.textColor + `;' ng-init='init(` + configAsJson + `)' ng-model='textContent' ng-keydown='enterkey($event)'>`;
        return html;
    };

    // Holds a reference to node-red-dashboard module.
    // Initialized at #1.
    var ui = undefined;

    // Node initialization function
    function gridNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                // #1: Load node-red-dashboard module.
                // Should use RED.require API to cope with loading different
                // module.  And it should also be executed at node
                // initialization time to be loaded after initialization of
                // node-red-dashboard module.
                //
                ui = RED.require("node-red-dashboard")(RED);
            }
            // Initialize node
            RED.nodes.createNode(this, config);
            var done = null;
            if (checkConfig(node, config)) {
                // Generate HTML/Angular code
                var html = HTML(config);
                // Initialize Node-RED Dashboard widget
                // see details: https://github.com/node-red/node-red-ui-nodes/blob/master/docs/api.md
                done = ui.addWidget({
                    node: node,			// controlling node
                    width: config.width,	// width of widget
                    height: config.height,	// height of widget
                    format: html,		// HTML/Angular code
                    templateScope: "local",	// scope of HTML/Angular(local/global)*
                    group: config.group,	// belonging Dashboard group
                    emitOnlyNewValues: false,
                    forwardInputMessages: false,
                    storeFrontEndInputAsState: false,
                    convertBack: function (value) {
                        return value;
                    },
                    beforeEmit: function(msg, value) {
                        // make msg.payload accessible as msg.items in widget
                        return { msg: { items: value } };
                    },
                    beforeSend: function (msg, orig) {
                        if (orig) {
                            return orig.msg;
                        }
                    },
                    initController: function($scope, events) {
                        // initialize $scope.click to send clicked widget item
                        // used as ng-click="click(item, selected)"
                        /*$scope.click = function(item, selected) {
                            if (selected) {
                                item.selected = selected;
                            }
                            $scope.send({payload: item});
                        };*/
                        $scope.$watch('msg', function(msg) {
                            if (!msg) {
                                console.log("the count from grid: "+msg.payload.length)
                                return;
                            }

                            // The payload contains the new text, which we will store on the scope (in the model)
                            $scope.textContent = msg.payload;
                        });
                    }
                });
            }
        }
        catch (e) {
            console.log(e);
        }
        node.on("close", function() {
            if (done) {
                // finalize widget on close
                done();
            }
        });
    }
    // register ui-grid node
    RED.nodes.registerType('ui-grid', gridNode);
};
