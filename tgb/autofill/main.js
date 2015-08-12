/*global define */
define([
    'jquery',
    'underscore',
    'template!./templates/tgb.html',
    'template!./templates/all_tgbs_button.html'
], function ($, _, templateTgb, templateButton) {
    'use strict';

    return {
        $mainBlock: null,
        $sidebarBlock: null,
        $mainContainer: null,
        $mainBlockHeight: null,
        tgbs: [],

        init: function(block, container) {
            this.$mainBlock = $(block);

            if (this.$mainBlock.length) {
                this._getTgbs();

                this.$sidebarBlock = $('.js-sidebar');
                this.$mainContainer = this.$mainBlock.find(container);
                this.$mainBlockHeight = this._getMainBlockHeight();
                this._updateMainBlockHeight();

                this._fillBlock();
            }
        },

        _getMainBlockHeight: function() {
            var sidebarHeight = parseInt(this.$sidebarBlock.css('height'), 10);
            var mainBlockHeight = sidebarHeight;

            this.$sidebarBlock.find('.page__section').each(function() {
                //if (!$(this).hasClass('last_section')) {
                    mainBlockHeight -= parseInt($(this).css('height'), 10);
                //}
            });

            return mainBlockHeight;
        },

        _updateMainBlockHeight: function() {
            var self = this;

            setInterval(function() {
                self.$mainBlockHeight = self._getMainBlockHeight.call(self);
            }, 500);
        },

        _fillBlock: function() {
            var self = this;
            var tgbHeight = 190;
            var allTgbsButtonHeight = 50;
            var countTgbsOnPage = 0;
            var countAvailableOnPage = 0;

            setInterval(function() {
                countTgbsOnPage = self.$mainContainer.find('li').length;
                countAvailableOnPage = parseInt((self.$mainBlockHeight - allTgbsButtonHeight)/tgbHeight, 10);

                if (self.tgbs.length && countTgbsOnPage < countAvailableOnPage) {
                    for (var i=countTgbsOnPage; i<countAvailableOnPage; i++) {
                        self.$mainContainer.append(templateTgb({
                            'title': self.tgbs[i]['title'],
                            'info': self.tgbs[i]['info'],
                            'site_url': self.tgbs[i]['site_url'],
                            'image_url': self.tgbs[i]['imageURL'],
                            'logoURL': self.tgbs[i]['logoURL']
                        }));
                    }

                    if (self.$mainBlock.find('.js-more').length === 0) {
                        self.$mainBlock.append(templateButton);
                    }

                    countTgbsOnPage = self.$mainContainer.find('li').length;

                    self.$mainBlock.find('li .inner:not(.clickable)').each(function() {
                        var $banner = $(this);
                        $banner.click(function (ev) {
                            var $el = $(ev.target);
                            if (!$el.closest('a').length) {
                                var $link = $(this).find('a');
                                if ($link.length) {
                                    window.open($link.attr('href'));
                                }
                            }
                        });
                        $banner.addClass('clickable');
                    });
                }
            }, 500);
        },

        _getTgbs: function() {
            var self = this;

            window.tgb_popup_callback = function (banners) {
                delete window.tgb_popup_callback;

                if (banners && banners.length) {
                    self.tgbs = banners;
                }
            };

            return $.ajax({
                url: this.$mainBlock.data('rotator-url'),
                type: 'GET',
                async: true,
                jsonpCallback: 'tgb_popup_callback',
                contentType: 'application/json',
                dataType: 'jsonp'
            });
        }
    };
});