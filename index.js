var LABEL_CHARACTER = ['a-z', 'A-Z', '0-9', '-', '_'];
var LABEL_SELF_CLOSE = ['BR', 'INPUT'];


// nodeType
//   0 Text Node
//   1 Label Node
function VirtualDOM(html) {
  var vnodes = this.vnodes = [];
  for (var i = 0; i < html.length; i++) {
    var lastNode = vnodes[vnodes.length - 1];
    if (lastNode && !lastNode.closed) {
      var result = lastNode.append(html[i]) || 0;
      i -= result;
    } else {
      vnodes.push(new VNode(html[i]));
    }
  }
  this.clean(this.vnodes);
}

VirtualDOM.prototype.clean = function clean(vnodes) {
  vnodes = vnodes || [];
  for (var i = 0; i < vnodes.length; i++) {
    var vnode = vnodes[i];
    delete vnode.closed;
    delete vnode.init;
    delete vnode.inTag;
    delete vnode.inTagClose;
    delete vnode.beforeInTag;
    if (vnode.nodeType === 1) {
      delete vnode.html;
    }
    clean(vnode.children);
  }
};


function VNode(str) {
  this.nodeType = 1;
  this.tagName = '';
  this.html = '';
  // this.attrs = {};
  this.children = [];

  this.closed = false;
  this.init = false;
  this.inTag = false;
  this.inTagClose = false;
  this.beforeInTag = false;

  if (typeof str === 'string') {
    this.append(str);
  }
}

VNode.prototype.append = function(str) {
  var lastChildrenVNode = this.children[this.children.length - 1];
  if (lastChildrenVNode && !lastChildrenVNode.closed) {
    return lastChildrenVNode.append(str);
  } else if (this.init) {
    if (this.nodeType === 3) {
      if (str === '<') {
        this.closed = true;
        return 1;
      }
    } else {
      if (this.inTag) {
        if (str === '<' && !/^<[a-zA-Z!]/.test(this.html)) {
          this.closed = true;
          this.inTag = false;
          this.nodeType = 3;
          return 1;
        } else if (str === '>') {
          // 自闭和 注释 <br /> | <br> | <br></br>
          if (/^<[a-zA-Z!]/.test(this.html)) {
            var tagName = this.tagName = this.html.match(new RegExp('^<([a-zA-Z!][' + LABEL_CHARACTER.join('') + ']*)'))[1].toUpperCase();
            this.closed = LABEL_SELF_CLOSE.indexOf(tagName) > -1;
            this.inTag = false;
            this.html = '';
            return;
          } else {
            if (/^<\/[a-zA-Z!]/.test(this.html)) {
              var tagName = this.html.match(new RegExp('^</([a-zA-Z!][' + LABEL_CHARACTER.join('') + ']*)'))[1].toUpperCase();
              if (LABEL_SELF_CLOSE.indexOf(tagName) > -1) {
                this.tagName = tagName;
                this.closed = true;
                this.inTag = false;
                this.html = '';
              } else {
                this.tagName = '';
                this.nodeType = -1;
                this.closed = true;
                this.inTag = false;
              }
              return;
            } else {
              this.inTag = false;
              this.nodeType = 3;
            }
          }
        }
      } else if (this.inTagClose) {
        if (str === '>') {
          var closeTagNameMatch = this.html.match(new RegExp('^</([a-zA-Z][' + LABEL_CHARACTER.join('') + ']*)'));
          var closeTagName = ((closeTagNameMatch || [])[1] || '').toUpperCase();
          if (closeTagName === this.tagName) {
            this.closed = true;
          } else if (this.html.match(/^<\/[a-zA-Z]/)) {
            // 吃掉
            this.inTagClose = false;
          } else {
            // TODO 注释节点 向子节点列表插入注释节点
            this.inTagClose = false;
          }
        }
      } else {
        if (this.beforeInTag) {
          if (str === '<') {
            if (LABEL_SELF_CLOSE.indexOf(this.tagName) < 0) {
              this.beforeInTag = false;
              this.children.push(new VNode('<'));
              // 关闭子节点 this.children[this.children.length - 1].close();
              this.children[this.children.length - 1].append(str);
            } else {
              this.closed = true;
              return 2;
            }
            return 1;
          } else if (str === '/') {
            this.inTagClose = true;
            this.html += '</';
          } else {
            this.beforeInTag = false;
            this.children.push(new VNode('<'));
            this.children[this.children.length - 1].append(str);
          }
        } else {
          if (str === '<') {
            this.beforeInTag = true;
          } else if (LABEL_SELF_CLOSE.indexOf(this.tagName) < 0) {
            this.children.push(new VNode(str));
          } else {
            this.closed = true;
            return 1;
          }
        }
        return;
      }
    }
  } else {
    this.nodeType = str === '<' ? 1 : 3;
    this.inTag = str === '<';
    this.init = true;
  }
  this.html += str;
};



// TODO 𠮷 &gt; &lt;
var html = '<div>HTML PARSER TO VIRTUAL DOM</div><p>By Clunt</p>';
var virtualDOM = new VirtualDOM(html);
console.log(virtualDOM)