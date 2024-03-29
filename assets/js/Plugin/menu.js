(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('/Plugin/menu', ['exports', 'Plugin'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('Plugin'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Plugin);
    global.PluginMenu = mod.exports;
  }
})(this, function (exports, _Plugin2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _Plugin3 = babelHelpers.interopRequireDefault(_Plugin2);

  var NAME = 'menu';

  var Menu = function (_Plugin) {
    babelHelpers.inherits(Menu, _Plugin);

    function Menu() {
      var _ref;

      babelHelpers.classCallCheck(this, Menu);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var _this = babelHelpers.possibleConstructorReturn(this, (_ref = Menu.__proto__ || Object.getPrototypeOf(Menu)).call.apply(_ref, [this].concat(args)));

      _this.folded = true;
      _this.foldAlt = true;
      _this.outerHeight = 0;
      return _this;
    }

    babelHelpers.createClass(Menu, [{
      key: 'getName',
      value: function getName() {
        return NAME;
      }
    }, {
      key: 'render',
      value: function render() {
        this.bindEvents();
        this.$el.data('menuApi', this);
      }
    }, {
      key: 'bindEvents',
      value: function bindEvents() {
        var self = this;

        this.$el.on('mouseenter.site.menu', '.site-menu-item', function () {
          var $item = $(this);
          if (self.folded === true && $item.is('.has-sub') && $item.parent('.site-menu').length > 0) {
            var $sub = $item.children('.site-menu-sub');
            self.position($item, $sub);
          }
          $item.addClass('hover');
        }).on('mouseleave.site.menu', '.site-menu-item', function () {
          var $item = $(this);
          if (self.folded === true && $item.is('.has-sub') && $item.parent('.site-menu').length > 0) {
            $item.children('.site-menu-sub').css('max-height', '');
            $item.removeClass('open');
          }
          $item.removeClass('hover');
        }).on('deactive.site.menu', '.site-menu-item.active', function (e) {
          $(this).removeClass('active');

          e.stopPropagation();
        }).on('active.site.menu', '.site-menu-item', function (e) {
          $(this).addClass('active');

          e.stopPropagation();
        }).on('open.site.menu', '.site-menu-item', function (e) {
          var $item = $(this);

          self.expand($item, function () {
            $item.addClass('open');
          });

          if (self.options.accordion) {
            $item.siblings('.open').trigger('close.site.menu');
          }

          e.stopPropagation();
        }).on('close.site.menu', '.site-menu-item.open', function (e) {
          var $item = $(this);

          self.collapse($item, function () {
            $item.removeClass('open');
          });

          e.stopPropagation();
        }).on('click.site.menu ', '.site-menu-item', function (e) {
          var $item = $(this);

          if ($item.is('.has-sub') && $(e.target).closest('.site-menu-item').is(this)) {
            if ($item.is('.open')) {
              $item.trigger('close.site.menu');
            } else {
              $item.trigger('open.site.menu');
            }
          } else if (!$item.is('.active')) {
            $item.siblings('.active').trigger('deactive.site.menu');
            $item.trigger('active.site.menu');
          }

          e.stopPropagation();
        }).on('tap.site.menu', '> .site-menu-item > a', function () {
          var link = $(this).attr('href');

          if (link) {
            window.location = link;
          }
        }).on('touchend.site.menu', '> .site-menu-item > a', function () {
          var $item = $(this).parent('.site-menu-item');

          if (self.folded === true) {
            if ($item.is('.has-sub') && $item.parent('.site-menu').length > 0) {
              $item.siblings('.hover').removeClass('hover');

              if ($item.is('.hover')) {
                $item.removeClass('hover');
              } else {
                $item.addClass('hover');
              }
            }
          }
        }).on('scroll.site.menu', '.site-menu-sub', function (e) {
          e.stopPropagation();
        });
      }
    }, {
      key: 'collapse',
      value: function collapse($item, callback) {
        var self = this;
        var $sub = $item.children('.site-menu-sub');

        $sub.show().slideUp(this.options.speed, function () {
          $(this).css('display', '');

          $(this).find('> .site-menu-item').removeClass('is-shown');

          if (callback) {
            callback();
          }

          self.$el.trigger('collapsed.site.menu');
        });
      }
    }, {
      key: 'expand',
      value: function expand($item, callback) {
        var self = this;
        var $sub = $item.children('.site-menu-sub');
        var $children = $sub.children('.site-menu-item').addClass('is-hidden');

        $sub.hide().slideDown(this.options.speed, function () {
          $(this).css('display', '');

          if (callback) {
            callback();
          }

          self.$el.trigger('expanded.site.menu');
        });

        setTimeout(function () {
          $children.addClass('is-shown');
          $children.removeClass('is-hidden');
        }, 0);
      }
    }, {
      key: 'refresh',
      value: function refresh() {
        this.$el.find('.open').filter(':not(.active)').removeClass('open');
      }
    }, {
      key: 'position',
      value: function position($item, $dropdown) {
        var itemHeight = $item.find('> a').outerHeight(),
            menubarHeight = this.outerHeight,
            offsetTop = $item.position().top;

        $dropdown.removeClass('site-menu-sub-up').css('max-height', '');

        if (offsetTop > menubarHeight / 2) {
          $dropdown.addClass('site-menu-sub-up');

          if (this.foldAlt) {
            offsetTop -= itemHeight;
          }
          $dropdown.css('max-height', offsetTop + itemHeight);
        } else {
          if (this.foldAlt) {
            offsetTop += itemHeight;
          }
          $dropdown.removeClass('site-menu-sub-up');
          $dropdown.css('max-height', menubarHeight - offsetTop);
        }
      }
    }], [{
      key: 'getDefaults',
      value: function getDefaults() {
        return {
          speed: 250,
          accordion: true
        };
      }
    }]);
    return Menu;
  }(_Plugin3.default);

  _Plugin3.default.register(NAME, Menu);

  exports.default = Menu;
});