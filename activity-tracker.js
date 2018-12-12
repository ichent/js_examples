;(function(window, F, $, _) {
    "use strict";

    var isActivityDisabled = function() {
		// TODO скрыл бизнес-логику
        return false;
    };

    /**
     * Отвечает за хранение данных по активити и событий активити
     **/
    function Storage() {
        // Кол-во последних поинтов, которые мы храним
        this._countSavedPoints = 1;
        // Массив поинтов (на само деле тут только один может быть)
        this._points = [];
        // Массив сохраненных поинтов (кол-во задается в _countSavedPoints)
        this._savedPoints = [];
        // Данные по активити пользователя
        this._data = [];
    }

    Storage.prototype.addPoint = function() {
        var point = {
            timestamp: Date.now()
        };

        if (isActivityDisabled()) {
            return;
        }

        this.clearPoints();
        this._points.push(point);
        this._savedPoints.push(point);

        if (this._savedPoints.length > this._countSavedPoints) {
            this._savedPoints = [];
            this._savedPoints.push(point);
        }
    };

    Storage.prototype.getLastPoint = function() {
        return this._points.length > 0 ? this._points[this._points.length - 1] : null;
    };

    Storage.prototype.getLastSavedPoint = function() {
        return this._savedPoints.length > 0 ? this._savedPoints[this._savedPoints.length - 1] : null;
    };

    Storage.prototype.clearPoints = function() {
        this._points = [];
    };

    Storage.prototype.clearSavedPoints = function() {
        this._savedPoints = [];
    };

    Storage.prototype.addData = function(data) {
        if (isActivityDisabled()) {
            return;
        }

        this._data.push(data);
    };

    Storage.prototype.getData = function() {
        return this._data;
    };

    Storage.prototype.getZippedData = function() {
        var data = this.getData();
        var zippedData = [];

        if (data.length > 0) {
            var dataItem = data[0];

            for (var i=1; i<data.length; i++) {
                if (dataItem.url !== data[i].url) {
                    zippedData.push(dataItem);
                    dataItem = data[i];
                } else {
                    dataItem = _.extend(dataItem, data[i], {
                        created: dataItem.created, activeTimeMSec: dataItem.activeTimeMSec + data[i].activeTimeMSec
                    });
                }
            }

            zippedData.push(dataItem);
        }

        return zippedData;
    };

    Storage.prototype.clearData = function() {
        this._data = [];
    };


    /**
     * Отвечает за отправку данных по активити
     **/
    function Request(settings, storage) {
        this._settings = settings;
        this._storage = storage;
        this._requestHandler = null;
        this._requestDeferred = null;
        this._requestsIntervalHandler = null;

        this._initRequestsTimer();
    }

    Request.prototype.send = function(event, customerToken) {
        var self = this;
		// TODO скрыл настоящий урл
        var url = "url";
        var data = this._storage.getZippedData();

        if (isActivityDisabled()) {
            return;
        }

        if (this._requestHandler) {
            this._requestHandler.abort();
        }

        if (data.length > 0) {
            self._requestDeferred = $.Deferred();

            if (event) {
                url = url + "?event=" + event;

                if (event === "logout-check-auth" && customerToken) {
                    url += "&ct=" + customerToken;
                }
            }

            self._requestHandler = $.ajax(url, {
                async: event !== "closing",
                type: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json, text/plain, */*"
                },
                data: JSON.stringify(data)
            }).always(function() {
                self._requestDeferred.resolve();
            });

            self._storage.clearData();
        }
    };

    Request.prototype.getRequestDeferred = function() {
        return this._requestDeferred;
    };

    Request.prototype._initRequestsTimer = function() {
        var self = this;

        window.clearInterval(this._requestsIntervalHandler);

        this._requestsIntervalHandler = window.setInterval(function() {
            self.send();
        }, self._settings.requestsDelay*1000);
    };


    /**
     * Отвечает за формирование данных по активити
     **/
    function Maker(settings, storage) {
        this._storage = storage;
        this._settings = settings;
        this._diffTime = 0;
        this._intervalHandler = null;
        this._prevUrl = null;
        this._metaData = {};

        this._initActivityTimer();
    }

    Maker.prototype.getDateISOString = function(date) {
        var pad = function (number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        };

        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds());
    };

    Maker.prototype.getServerDateTime = function() {
        return new Date(new Date().getTime() - this._diffTime);
    };

    Maker.prototype.changeDiffTime = function(diffTime) {
        this._diffTime = diffTime;
    };

    Maker.prototype.getCookie = function(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }

        return "";
    };

    Maker.prototype._initActivityTimer = function() {
        var self = this;

        window.clearInterval(this._intervalHandler);

        this._intervalHandler = window.setInterval(function() {
            var lastPoint = self._storage.getLastPoint();
            var lastSavedPoint = self._storage.getLastSavedPoint();
            var data = {
                "created": self.getDateISOString(self.getServerDateTime()),
                "url": window.location.href
            };

            data = _.extend(data, self._metaData);

            if (lastPoint || (lastSavedPoint && (Date.now()/1000 - lastSavedPoint.timestamp/1000) < self._settings.activityDelay)) {
                self._storage.clearPoints();

                data.activeTimeMSec = self._settings.activityShortDelay*1000;
                self._storage.addData(data);
            } else {
                self._storage.clearPoints();
                self._storage.clearSavedPoints();
            }
        }, self._settings.activityShortDelay*1000);
    };

    Maker.prototype.setMetaData = function() {
        var prt = this.getCookie("prt"),
            prdid = this.getCookie("prdid"),
            slId = this.getCookie("sl.id") || this.getCookie("activity.searchToken");
        var url = window.location.href;

        if (this._prevUrl === null || url !== this._prevUrl) {
            this._metaData = {};

            if (window.tabId !== 0) {
                this._metaData.pubDivId = window.tabId;
            }
            if (window.modId) {
                this._metaData.modID = "" + window.modId;
            }
            if (window.uid) {
                this._metaData.docID = window.uid;
            }
            if (prt) {
                this._metaData.pageRequestToken = prt;
            }
            if (prdid) {
                this._metaData.pageRequestDicID = prdid;
            }
            if (slId && slId.match(/^\d+$/) === null) {
                this._metaData.searchToken = slId;
            }
        }

        this._prevUrl = url;
    };


    F.UserActivityTracker = function(pathName) {
        F.UserActivityTracker.superclass.constructor.apply(this, [pathName]);
    };

    extend(F.UserActivityTracker, F.Module);

    F.UserActivityTracker.prototype.init = function(settings) {
        this._settings = settings;
        this._storage = new Storage();
        this._request = new Request(settings, this._storage);
        this._maker = new Maker(settings, this._storage);
        this._isClosingEventFired = false;

        this._setMetaData();
        this._initEventsForForceRequest();
        this._initEventsForMakingPoints();
    };

    F.UserActivityTracker.prototype.sendActivity = function(event, customerToken) {
        this._request.send(event, customerToken);
    };

    F.UserActivityTracker.prototype.changeDiffTime = function(diffTime) {
        this._maker.changeDiffTime(diffTime);
    };

    // Получение кук и прочих данных для активити
    F.UserActivityTracker.prototype._setMetaData = function() {
        this.bind("@location|init.useractivitytracker", function () {
            this._maker.setMetaData();
        });

        this._maker.setMetaData();
    };

    F.UserActivityTracker.prototype._initEventsForForceRequest = function() {
        var self = this;

        self.unbind("@user|logout:before.useractivitytracker");
        if (window.removeEventListener) {
            window.removeEventListener("beforeunload", function() {});
        }

        // Отправка данных после разлогина
        self.bind("@user|logout:before.useractivitytracker", function() {
            self.sendActivity("logout");
        });

        window.addEventListener("beforeunload", function() {
            if (window.onExport !== true) {
                if (self._isClosingEventFired === false) {
                    self._isClosingEventFired = true;
                    self.sendActivity("closing");
                }
            }

            return;
        }, false);
    };

    F.UserActivityTracker.prototype._initEventsForMakingPoints = function() {
        var self = this;

        window.$window.unbind(".useractivitytracker");
        $(".js-export").off("click.useractivitytracker");

        // Чтобы первый заход на страницу даже без активности записал статистику
        self._storage.addPoint();

        window.$window.bind("scroll.useractivitytracker click.useractivitytracker keyup.useractivitytracker", _.throttle(function ()  {
            self._storage.addPoint();
        }, 100));

        window.$window.bind("resize.useractivitytracker", _.throttle(function(e) {
            if (!e.isTrigger) {
                self._storage.addPoint();
            }
        }, 100));

        if (self._settings.isMousemoveEnabledV3) {
            window.$window.bind("mousemove.useractivitytracker", _.throttle(function() {
                self._storage.addPoint();
            }, 100));
        }

        window.$window.bind("focus.useractivitytracker", function() {
            // После эскпорта при вовзрате фокуса на вкладку
            if (window.onExport) {
                window.onExport = false;
            }
        });

        $(".js-export").on("click.useractivitytracker", function() {
            // При экспорте срабатывает beforeunload, который нам не нужен
            window.onExport = true;
        });
    };

    F.UserActivityTracker.prototype.destroy = function() {
        F.UserActivityTracker.superclass.destroy.apply(this);
    };


}(this, this.F, window.jQuery, window._));
