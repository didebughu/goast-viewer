var goastapp = angular.module('goast', ['ui.tree'], function($rootScopeProvider) {
  $rootScopeProvider.digestTtl(30);
});

// Directive
// ---------
goastapp.directive('fileChange', function () {

  var linker = function ($scope, element, attributes) {
    // 获取文本区域元素
    var textareaElement = document.getElementById("code");

    // onChange, push the files to $scope.sourcefile and read file content
    element.bind('change', function (event) {
      var files = event.target.files;
      $scope.$apply(function () {
        $scope.sourcefile = files[0];

        // 使用 FileReader 读取文件内容
        var reader = new FileReader();
        reader.onload = function(e) {
          var fileContent = e.target.result;

          // 将文件内容设置到 $scope.source 变量中
          $scope.$apply(function () {
            $scope.source = fileContent;
          });
        };

        // 读取文件内容
        reader.readAsText(files[0]);
      });
    });

    // 监听 $scope.source 变量的变化，将内容设置到文本区域中
    $scope.$watch('source', function(newSource) {
      textareaElement.value = newSource;
    });
  };

  return {
    restrict: 'A',
    link: linker
  };

});

// Factory
// -------
goastapp.factory('uploadService', ['$rootScope', '$http',  function ($rootScope, $http) {

    return {
        send: function (file, callback) {
            var data = new FormData(),
                xhr = new XMLHttpRequest();

            // When the request starts.
            xhr.onloadstart = function () {
                $rootScope.$emit('upload:loadstart', xhr);
            };

            // When the request has failed.
            xhr.onerror = function (e) {
                $rootScope.$emit('upload:error', e);
            };

            // Send to server
            data.append('sourcefile', file, file.name);
            // xhr.open('POST', '/parse.json');
            // xhr.send(data);
            $http.post('parse.json',data,
            {
                headers:{"Content-type":undefined}
                ,transformRequest: null
            }).success(callback) ;
        }
    };

}]);


// Controller
// ----------
goastapp.controller('GoastController', ['$scope', '$rootScope', 'uploadService', '$http', function ($scope, $rootScope, uploadService, $http) {

    // 'file' is a JavaScript 'File' objects.
    $scope.sourcefile = null;

    $scope.asts   = null;
    $scope.dump   = null;
    $scope.source = "package main\n\
\n\
import (\n\
	\"fmt\"\n\
)\n\
\n\
func main() {\n\
	fmt.Printf(\"Hello, Golang\\n\")\n\
}\n\
";


    $scope.$watch('sourcefile', function (newValue, oldValue) {
        // Only act when our property has changed.
        if (newValue != oldValue) {
            // Hand file off to uploadService.
            uploadService.send($scope.sourcefile,function(data, status, headers, config) {
              $scope.asts   = [data.ast];
              $scope.source = data.source;
              $scope.dump   = data.dump;
            });
        }
    }, true);

    $scope.collapsedLabel = function(scope) {

      if (scope.node.children.length > 0 ) {
        if (scope.collapsed) {
          return "+";
        } else {
          return "−";
        }
      } else {
        return " ";
      }
    }

    $scope.parse = function() {
      window.global.source = $scope.source
      run()
      let data = JSON.parse(output);
      $scope.asts   = [data.ast];
      $scope.source = data.source;
      $scope.dump   = data.dump;
    }

    $scope.toggle = function(scope) {
      scope.toggle();
    };

    $scope.focus = function(scope) {
      var textarea = document.getElementById("code")
      var from = scope.node.pos - 1;
      var to   = scope.node.end - 1;

      if (textarea.setSelectionRange) {
        textarea.setSelectionRange(from, to);
      } else if(textarea.createTextRange) {
        var rng = textarea.createTextRange();
        rng.moveStart("character",  from );
        rng.moveEnd("character",  to);
        rng.select();
      }
      return false;
    }

    var getRootNodesScope = function() {
      return angular.element(document.getElementById("tree-root")).scope();
    };

    $scope.collapseAll = function() {
      var scope = getRootNodesScope();
      scope.collapseAll();
    };

    $scope.expandAll = function() {
      var scope = getRootNodesScope();
      scope.expandAll();
    };

}]);
