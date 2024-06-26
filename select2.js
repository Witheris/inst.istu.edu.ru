jQuery(document).ready(function($) {

    sm().processors().add_processor('select2', function(elements, method, method_params)
    {
        var methods = {
            init : function(method_params)
            {
                def_params = {

                };

                return elements.each(function()
                {
                    var elm = $(this);

                    var params = $.extend({}, def_params, method_params, method_params['data_attr'] ? (elm.data(method_params['data_attr']) || {}) : {});

                    var plugin_params = {

                    }

                    $(elm).select2(plugin_params);
                });
            },

            destroy : function()
            {

            }
        };

        if (methods[method || 'init']) return methods[method || 'init'].apply(this, Array.prototype.slice.call(arguments, 2));
    });


});
