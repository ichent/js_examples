define(['underscore', 'jquery'], function(_, $) {

    return {
        init: function(elements) {
            var gallery = {
                $mainContainer: null,
                $previewContainer: null,
                $bigPhoto: null,
                $buttonNext: null,
                $buttonPrev: null,
                previewPosition: 1,
                previewCount: 0,
                // Индексы видимых в данный момент превьюшек
                previewVisibleInterval: [1, 8],

                init: function(elements) {
                    this.$mainContainer = $(elements);

                    if (this.$mainContainer.length === 0) {
                        console.warn('Элемент не найден');
                        return;
                    }

                    this.$bigPhoto = this.$mainContainer.find('.js-big-photo');
                    this.$previewContainer = this.$mainContainer.find('.js-preview');
                    this.$buttonPrev = this.$mainContainer.find('.js-button-prev');
                    this.$buttonNext = this.$mainContainer.find('.js-button-next');

                    this.previewCount = this.$previewContainer.find('li').length;

                    this._setButtonsVisible();
                    this._clickButtons();
                    this._clickPreview();
                },

                _setButtonsVisible: function() {
                    this.$buttonPrev.toggle(this.previewPosition > 1);
                    this.$buttonNext.toggle(this.previewPosition < this.previewCount);
                },

                _clickButtons: function() {
                    var that = this;

                    this.$buttonPrev.on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        that.$previewContainer.find('li.current').prev().find('a').click();
                    });

                    this.$buttonNext.on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        that.$previewContainer.find('li.current').next().find('a').click();
                    });
                },

                _clickPreview: function() {
                    var that = this;

                    this.$previewContainer.find('.js-preview-photo').click(function(e) {
                        e.stopPropagation();
                        e.preventDefault();

                        var $img = that.$bigPhoto.find('img');
                        var url = $(this).data('image-big');
                        if ($img.length) {
                            $img.prop('src', url);
                        } else {
                            var $div = that.$bigPhoto.find('div.slide');
                            if ($div.length) {
                                $div.css('background-image', 'url(' + url + ')');
                            }
                        }

                        that.$previewContainer.find('.js-preview-photo').each(function() {
                            $(this).parent().removeClass('current');
                        });

                        $(this).parent().addClass('current');
                        that.previewPosition = $(this).data('index');
                        that._setButtonsVisible();
                        that._setPreviewOffset();
                    });
                },

                _setPreviewOffset: function() {
                    var tgbWidth = 72;
                    var leftOffset = parseInt(this.$previewContainer.css('left'), 10);


                    if (this.previewPosition === this.previewVisibleInterval[1] && this.previewVisibleInterval[1] < this.previewCount) {
                        this.$previewContainer.css({left: leftOffset - tgbWidth + 'px'});
                        this.previewVisibleInterval[0]++;
                        this.previewVisibleInterval[1]++;
                    } else if (this.previewPosition === this.previewVisibleInterval[0] && this.previewVisibleInterval[0] > 1) {
                        this.previewVisibleInterval[0]--;
                        this.previewVisibleInterval[1]--;
                        this.$previewContainer.css({left: leftOffset + tgbWidth + 'px'});
                    }
                }
            };

            gallery.init(elements);
        }
    };
});
