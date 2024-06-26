var SM_AJAX_URL = '/ajax/call.php';

window.smartsite = (function ($) {

    var self = {},
        popup;


    self.dialogs = {};

    self.templateLoaded = function ( id ) {
        var compiled,
            /*
             * Underscore's default ERB-style templates are incompatible with PHP
             * when asp_tags is enabled, so WordPress uses Mustache-inspired templating syntax.
             *
             * @see trac ticket #22344.
             */
            options = {
                evaluate:    /<#([\s\S]+?)#>/g,
                interpolate: /\{\{\{([\s\S]+?)\}\}\}/g,
                escape:      /\{\{([^\}]+?)\}\}(?!\})/g,
                variable:    'data'
            };

        return function ( data ) {
            compiled = compiled || _.template( $( '#tmpl-' + id ).html(),  options );
            return compiled( data );
        };
    };


    self.ajaxCall = function (method, url, query_get, query_post, callback) {

        if (!callback) callback = function () {};

        var url = url || SM_AJAX_URL;

        query_get = query_get || {};

        url += ( url.indexOf('?') >= 0 ? '&' : '?' ) + $.param(query_get);

        method = method || 'POST';

        if (query_post)
        {
            method = 'POST';
        }

        $.ajax({
            'type':     method,
            'dataType': 'json',
            'url':      url,
            'cache':    false,
            'data':     query_post,
            'success':  callback,
            'error':    function (response) {

            }
        });
    };


    self.ajaxRequest  = function(sender, method, action, query_get, query_post, options, callback, url) {

        options = options || {};

        if (options.confirm && !confirm(options.confirm)) return;

        var context = {};

        var elSender = $(sender);
        var elManager = $(options.manager);
        var elDispatcher =  $(options.dispatcher);

        context['options'] = options;
        context['sender'] = elSender;
        context['manager'] = elManager;
        context['dispatcher'] = elDispatcher;

        if (method=='GET')
        {
            query_get = query_get || {};

            query_get['SM_AJAX_CALL'] = action;
        }
        else
        {
            query_post = query_post || {};

            query_post['SM_AJAX_CALL'] = action;
        }

        self.ajaxCall(method, url, query_get, query_post, function (response) {

            if (!response) return;

            self.processResponse(response);

            if (response.events && options.events)
            {
                var eventItems;

                $.each(response.events, function (i, triggeredEvent) {

                    if (options.events && (eventItems = options.events[triggeredEvent.NAME]))
                    {
                        if (typeof eventItems == "string")
                        {
                            eval(eventItems);
                        }
                        else if ($.isArray(eventItems))
                        {
                            for (var i = 0; i < eventItems.length; i++)
                            {
                                var eventItem = eventItems[i];

                                if (typeof eventItem == "string")
                                {
                                    eval(eventItem);
                                }
                            }
                        }
                    }

                });
            }

            if (response.SUCCESS)
            {
                if (options.onSuccess) options.onSuccess.apply(context, [response]);
            }
            else
            {
                if (options.onError) options.onError.apply(context, [response]);
            }

            if (callback) callback.apply(context, [response]);
        });

    };

    self.ajaxRequestComponent = function(sender, method, component, query_get, query_post, options, callback, url) {

        var query;

        options = options || {};

        if (method === "GET")
        {
            query_get = query_get || {};

            query = query_get;
        }
        else
        {
            query_post = query_post || {};

            query = query_post;
        }

        query['com_name'] = component['name'];
        query['com_template'] = component['template'];
        query['com_params'] = component['params'];
        query['com_params_signed'] = component['params_signed'];

        self.ajaxRequest(sender, method, 'component', query_get, query_post, options, callback, url);
    }

    self.ajaxDialogComponent = function(sender, method, component, query_get, query_post, options, callback, url) {

        console.log(options);

        var dialog_options = options.dialog || {};

        smartsite.ajaxRequestComponent(sender, method, component, query_get, query_post, options, function (response) {

            var container;
            var parameters;

            if (popup) {
                popup.destroy();
            }


            container = $('<div>', {'style': 'display: none'}).appendTo($('body'));

            container.html(response.data.content);

            container = container.get(0);

            parameters = $.extend({
                content: container,
                closeIcon: {
                    right: '20px',
                    top: '22px'
                },
                zIndex: 0,
                offsetLeft: 0,
                offsetTop: 0,
                width: 450,
                overlay: true
            }, dialog_options);

            if (dialog_options.width)
                parameters.width = dialog_options.width;

            if (dialog_options.title) {
                parameters.titleBar = {
                    content: BX.create('span', {html: dialog_options.title, props: {className: 'access-title-bar'}})
                }
            }

            popup = new BX.PopupWindow('UniverseComponent', null, parameters);
            popup.show();

        }, url);

    }

    self.processResponse = function(response) {

        if (response !== null && typeof response === 'object')
        {
            if (response.redirect)
            {
                window.location = response.redirect;
            }

            if (response.events)
            {
                $.each(response.events, function (id, event) {

                    var selectors = $.isArray(event.DISPATCHERS) ? event.DISPATCHERS.join(',') : event.DISPATCHERS;

                    $(selectors).trigger(event.NAME, event.PARAMS);

                });
            }

            if (response.messages)
            {
                var arMessagesByDest = {};

                $.each(response.messages, function (id, message) {

                    if (!arMessagesByDest[message.DEST]) arMessagesByDest[message.DEST] = [];

                    arMessagesByDest[message.DEST].push(message);

                });

                $.each(arMessagesByDest, function (dest, messages) {

                    $('.com-messages.dest-'+dest).trigger('messages.process', [messages]);

                });
            }

            if (response.data)
            {
                var triggers = $('[data-response-trigger]');

                triggers.each(function () {

                    var elm = $(this);

                    if (response.data[elm.attr('data-response-trigger')])
                    {
                        elm.html(response.data[elm.attr('data-response-trigger')]);
                    }
                });
            }

        }
    }

    return self;

})(jQuery);






