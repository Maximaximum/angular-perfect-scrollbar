var Ps = require('perfect-scrollbar');

angular.module('perfect_scrollbar', []).directive('perfectScrollbar',
  ['$parse', '$window', function($parse, $window) {

    //Ps options to test against when creating options{}
    var psOptions = [
      'wheelSpeed', 'wheelPropagation', 'minScrollbarLength', 'useBothWheelAxes',
      'useKeyboard', 'suppressScrollX', 'suppressScrollY', 'scrollXMarginOffset',
      'scrollYMarginOffset', 'includePadding'//, 'onScroll', 'scrollDown'
    ];

    return {
      restrict: 'EA',
      transclude: true,
      template: '<div><div ng-transclude></div></div>',
      replace: true,
      link: function($scope, $elem, $attr) {
        if ($attr.perfectScrollbar == "false") return;
        var el = $elem[0];
        var jqWindow = angular.element($window);
        var options = {};

        //search Ps lib options passed as attrs to wrapper
        for (var i=0, l=psOptions.length; i<l; i++) {
          var opt = psOptions[i];
          if (typeof $attr[opt] !== 'undefined') {
            options[opt] = $parse($attr[opt])();
          }
        }

        $scope.$evalAsync(function() {
          Ps.initialize(el, options);
          if ($attr['onScroll']) {
            var onScrollHandler = $parse($attr.onScroll);
            $elem.on('scroll', function(){
              var scrollTop = el.scrollTop;
              var scrollHeight = el.scrollHeight - el.clientHeight;
              $scope.$apply(function() {
                onScrollHandler($scope, {
                  scrollTop: scrollTop,
                  scrollHeight: scrollHeight
                });
              });
            });
          }
        });

        function update(event) {
          $scope.$evalAsync(function() {
            if ($attr.scrollDown == 'true' && event != 'mouseenter') {
              setTimeout(function () {
                el.scrollTop = el.scrollHeight;
              }, 100);
            }
            Ps.update(el);
          });
        }

        // This is necessary when you don't watch anything with the scrollbar
        $elem.bind('mouseenter', function() {update('mouseenter');});

        // Update perfect-scroll when content dimensions change
        var scrollHeight, scrollWidth; // Used to detect scroll content dimension changes.
        $scope.$watch(function () {
          setTimeout(function () {
            var newScrollHeight = $elem.children("[ng-transclude]")[0].scrollHeight;
            var newScrollWidth = $elem.children("[ng-transclude]")[0].scrollWidth;

            if (newScrollHeight != scrollHeight || newScrollWidth != scrollWidth) {
              Ps.update(el);
              scrollHeight = newScrollHeight;
              scrollWidth = newScrollWidth;
            }
          }, 100);
        });

        // Possible future improvement - check the type here and use the appropriate watch for non-arrays
        if ($attr.refreshOnChange) {
          $scope.$watchCollection($attr.refreshOnChange, function() {
            update();
          });
        }

        // update scrollbar once window is resized
        if ($attr.refreshOnResize) {
          jqWindow.on('resize', update);
        }

        $elem.bind('$destroy', function() {
          jqWindow.off('resize', update);
          Ps.destroy(el);
        });

      }
    };
  }]);
