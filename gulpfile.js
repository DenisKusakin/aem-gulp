const gulp = require('gulp');
const debug = require('gulp-debug');
const path = require('path');
const through = require('through2').obj;
const File = require('vinyl');
const xmlParser = require('xml2js').parseString;
const manager = require('./components.js');

var components = {};

const getAttrValue = function(xmlData, attrName){
    
    try{
        return xmlData['jcr:root'].$[attrName];
    }catch(e){
        return undefined;
    }
}; 

gulp.task('default', function(){
    return gulp.src('jcr_root/apps/**/*.html', {dot: true})
        .pipe(through(function(file, enc, callback){
            var dirname = path.dirname(file.relative).replace(new RegExp("\\\\", "g"), "/");
            var filename = path.basename(file.relative);
            
            var component;

            if(components[dirname]){
                component = components[dirname];
            }else{
                component = {
                    "resourceType": dirname,
                    "files" : {}
                }
                components[dirname] = component;
            }
            component.files[filename] = String(file.contents);
            callback();
        }))
        .pipe(gulp.src('jcr_root/apps/**/*content.xml', {dot: true}))
        .pipe(through(function(file, enc, callback){
            var fileContent = file.contents;
            var dirname = path.dirname(file.relative).replace(new RegExp('\\\\', "g"), "/");
            var component = components[dirname];
            if(!component){
                component = {
                    resourceType: dirname,
                    files: {}
                };
            }
            xmlParser(String(fileContent), function(err, data){
                var primaryType = getAttrValue(data, 'jcr:primaryType');
                var isComponent = primaryType === 'cq:Component' || primaryType === 'sling:Folder';

                if(isComponent){
                    var title = getAttrValue(data, 'jcr:title');
                    var superType = getAttrValue(data, "sling:resourceSuperType");
                    
                    if(title){
                        component.title = title;
                    }
                    if(superType){
                        component.slingResourceSuperType = superType;
                    }
                    components[dirname] = component;
                }
                
                callback();
            });
        }, function(callback){
               manager.setComponents(components);
               console.log(manager.getHtml('ds-flagship/components/pages/page'));
            //    let manifest = new File({
            //        contents: new Buffer(manager.getHTML('ds-flagship/components/pages/page')),
            //        base: process.cwd(),
            //        path: process.cwd() + "/manifest.json"
            //    });
            //    this.push(manifest);
               callback();
        }))
        //.pipe(gulp.dest('public'))
})