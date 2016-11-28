const _ = require('underscore-node');
const cheerio = require('cheerio');

var components = {};

class Component{
    constructor(comp){
        this.resourceType = comp.resourceType;
        var superType = comp.slingResourceSuperType;
        if(superType){
            this.superType = superType.startsWith("/apps") ? superType.split("/apps/")[1] : superType;
        }
        this.files = _.extend({}, comp.files);
    }

    getSuperType(){
        return this.superType;
    }

    getMainFileName(){
        return this.resourceType.substring(this.resourceType.lastIndexOf("/") + 1) + ".html";
    }

    isMainFileDefined(){
        return this.files[this.getMainFileName()] !== undefined;
    }

    toString(){
        return JSON.stringify(this);
    }
}

function setComponentsStructure(structure){
    components = structure;
}

function getComponent(resType){
    var component;
    if(components[resType] === undefined){
        return new Component({
            resourceType: resType,
            files: {}
        });
    }else{
        component = new Component(components[resType]);
    }

    var superType = component.getSuperType();
    var parentComponent; 
    if(superType){ 
        parentComponent = getComponent(component.getSuperType());
    }

    if(parentComponent){
        component.files = _.extend({}, parentComponent.files, component.files);
        if(!component.isMainFileDefined() && parentComponent.isMainFileDefined()){
            component.files[component.getMainFileName()] = parentComponent.files[parentComponent.getMainFileName()];
            delete component.files[parentComponent.getMainFileName()];
        }
    }
    
    return component;
}

function getComponentHTML(resType){
    var component = getComponent(resType);
    var $ = cheerio.load(component.files[component.getMainFileName()]);
    return $('[data-sly-include]').data('slyInclude');
}

function getHTML(json){

}

module.exports.setComponents = setComponentsStructure;
module.exports.getComponent = getComponent;
module.exports.getHtml = getComponentHTML;