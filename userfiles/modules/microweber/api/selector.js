mw.css = function(element, css){
    for(var i in css){
        element.style[i] = typeof css[i] === 'number' ? css[i] + 'px' : css[i];
    }
}
mw.Selector = function(options) {


    this.buildSelector = function(){
        var stop = document.createElement('div');
        var sright = document.createElement('div');
        var sbottom = document.createElement('div');
        var sleft = document.createElement('div');

        stop.className = 'mw-selector mw-selector-top';
        sright.className = 'mw-selector mw-selector-right';
        sbottom.className = 'mw-selector mw-selector-bottom';
        sleft.className = 'mw-selector mw-selector-left';

        document.body.appendChild(stop);
        document.body.appendChild(sright);
        document.body.appendChild(sbottom);
        document.body.appendChild(sleft);

        this.selectors.push({
            top:stop,
            right:sright,
            bottom:sbottom,
            left:sleft,
            active:false
        });
    }

    this.getFirstNonActiveSelector = function(){
        let i = 0;
        for( ; i <  this.selectors.length; i++){
            if(!this.selectors[i].active){
                return this.selectors[i]
            }
        }
        this.buildSelector();
        return this.selectors[this.selectors.length-1];
    }
    this.deactivateAll = function(){
         let i = 0;
        for( ; i <  this.selectors.length; i++){
            this.selectors[i].active = false;
        }
    }

    this.hideAll = function(){
        let i = 0;
        for( ; i <  this.selectors.length; i++){
            this.hideItem(this.selectors[i]);
        }
    }

    this.hideItem = function(item){

        item.active = false;
        for (let x in item){
            if(!item[x]) continue;
            item[x].style.visibility = 'hidden';
        }
    }
    this.showItem = function(item){

        for (let x in item){
            if(typeof item[x] === 'boolean') continue;
            item[x].style.visibility = 'visible';
        }
    }

    this.buildInteractor = function(){
        var stop = document.createElement('div');
        var sright = document.createElement('div');
        var sbottom = document.createElement('div');
        var sleft = document.createElement('div');

        stop.className = 'mw-selector mw-interactor mw-selector-top';
        sright.className = 'mw-selector mw-interactor mw-selector-right';
        sbottom.className = 'mw-selector mw-interactor mw-selector-bottom';
        sleft.className = 'mw-selector mw-interactor mw-selector-left';

        document.body.appendChild(stop);
        document.body.appendChild(sright);
        document.body.appendChild(sbottom);
        document.body.appendChild(sleft);

        this.interactors = {
            top:stop,
            right:sright,
            bottom:sbottom,
            left:sleft,
        }
    }
    this.isSelected = function(e){
        var target = e.target?e.target:e;
        return this.selected.indexOf(target) !== -1;
    }

    this.unsetItem = function(e){
        var target = e.target?e.target:e;
        for(let i = 0;i<this.selectors.length;i++){
            if(this.selectors[i].active === target){
                this.hideItem(this.selectors[i]);
                break;
            }
        }
        this.selected.splice(this.selected.indexOf(target), 1);
    }

    this.positionSelected = function(){
        for(let i = 0;i<this.selectors.length;i++){
            this.position(this.selectors[i], this.selectors[i].active)
        }
    }
    this.position = function(item, target){
        let off = $(target).offset();
        mw.css(item.top, {
            top:off.top,
            left:off.left,
            width:target.offsetWidth
        })
        mw.css(item.right, {
            top:off.top,
            left:off.left+target.offsetWidth,
            height:target.offsetHeight
        })
        mw.css(item.bottom, {
            top:off.top+target.offsetHeight,
            left:off.left,
            width:target.offsetWidth
        })
        mw.css(item.left, {
            top:off.top,
            left:off.left,
            height:target.offsetHeight
        });
    }

    this.setItem = function(e, item, select, extend){
        var target = e.target?e.target:e;
        target = mw.tools.firstMatchesOnNodeOrParent(target, ['[id]']);
        var validateTarget = !mw.tools.firstMatchesOnNodeOrParent(target, ['.mw-control-box', '.mw-defaults']);
        if(!target || validateTarget) return;
        if($(target).hasClass('mw-select-skip')){
            return this.setItem(target.parentNode, item, select, extend);
        }
        if(select){
            if(this.isSelected(target)){
                this.unsetItem(target)
                return false;
            }
            else{
                if(extend){
                    this.selected.push(target);
                }
                else{
                    this.selected = [target];
                }
                $(this).trigger('select');
            }

        }


        this.position(item, target)

        item.active = target;

        this.showItem(item);
    }

    this.select = function(e, target){
        if(!e && !target) return;
        target = target || e.target;
        if(e.ctrlKey){
            this.setItem(target, this.getFirstNonActiveSelector(), true, true);
        }
        else{
            this.hideAll()
            this.setItem(target, this.selectors[0], true, false);
        }

    }

    this.deselect = function(e, target){
        e.preventDefault()
        target = target || e.target;

        this.unsetItem(target);

    };

    this.init = function(){
        this.buildSelector();
        this.buildInteractor();
        var scope = this;
        $(this.root).on("click", function(e){
            if(scope.active){
                scope.select(e);
            }
        });

        $(this.root).on( "mousemove", function(e){
            if(scope.active){
                scope.setItem(e, scope.interactors)
            }
        });
        $(this.root).on( 'scroll', function(){
            scope.positionSelected();
        });
        $(window).on('resize orientationchange', function(){
            scope.positionSelected();
        });
    };


    this.active = false;
    this.selected = [];
    this.selectors = [];
    this.root = options.root;
    this.init();
};