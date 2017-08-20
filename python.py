#!/usr/bin/python
# -*- coding: UTF-8 -*-
#
import re
import json


LABEL_CHARACTER = ('a-z', 'A-Z', '0-9', '-', '_');
LABEL_SELF_CLOSE = ['BR', 'INPUT'];



class VNode:
  closed = False;
  nodeType = 1;
  tagName = '';
  html = '';
  children = [];

  closed = False;
  init = False;
  inTag = False;
  inTagClose = False;
  beforeInTag = False;


  def __init__(self, html):
    if len(html) > 0:
      self.append(html);

  def close(self):
    self.closed = True;

  def append(self, html):
    log = [html]
    if len(self.children):
      log.append(self.children[-1].closed)
    print log
    if len(self.children) > 0 and not self.children[-1].closed:
      # TODO
      # print html
      # return self.children[-1].append(html);
      if html == 'h':
        self.children[-1].append(html);
        self.children[-1].closed();
      return
    elif self.init:
      if self.nodeType == 3:
        if html == '<':
          self.closed = True;
          return 1;
      else:
        if self.inTag:
          if html == '<' and not re.match('^<[a-zA-Z!]', self.html):
            self.closed = True;
            self.inTag = False;
            self.nodeType = 3;
            return 1;
          elif html == '>':
            if re.match('^<[a-zA-Z!]', self.html):
              self.tagName = re.match('^<([a-zA-Z!][' + ''.join(LABEL_CHARACTER) + ']*)', self.html).group(1).upper();
              self.closed = (',' + ','.join(LABEL_SELF_CLOSE) + ',').find(',' + self.tagName + ',') > -1;
              self.inTag = False;
              self.html = '';
              return;
            else:
              if re.match('^<\/[a-zA-Z!]', self.html):
                tagName = re.match('^</([a-zA-Z!][' + ''.join(LABEL_CHARACTER) + ']*)', self.html).group(1).upper();
                if (',' + ','.join(LABEL_SELF_CLOSE) + ',').find(',' + tagName + ',') > -1:
                  self.tagName = tagName;
                  self.closed = True;
                  self.inTag = False;
                  self.html = '';
                else:
                  self.tagName = '';
                  self.nodeType = -1;
                  self.closed = True;
                  self.inTag = False;
                return;
              else:
                self.inTag = False;
                self.nodeType = 3;
        elif self.inTagClose:
          if html == '>':
            closeTagName = '';
            tagNameMatch = re.match('^</([a-zA-Z][' + ''.join(LABEL_CHARACTER) + ']*)', html);
            if tagNameMatch:
              closeTagName = tagNameMatch.group(1).upper();
            if closeTagName == self.tagName:
              self.closed = True;
            elif re.match('^<\/[a-zA-Z]', html):
              self.inTagClose = False;
            else:
              self.inTagClose = False;
        else:
          if self.beforeInTag:
            if html == '<':
              if (',' + ','.join(LABEL_SELF_CLOSE) + ',').find(',' + self.tagName + ',') < 0:
                self.beforeInTag = False;
                self.children.append(VNode('<'));
                self.children[-1].append(html);
                return 1;
              else:
                self.closed = True;
                return 2;
            elif html == '/':
              self.inTagClose = True;
              self.html += '</';
            else:
              self.beforeInTag = False;
              self.children.append(VNode('<'));
              self.children[-1].append(html);
          else:
            if html == '<':
              self.beforeInTag = True;
            elif (',' + ','.join(LABEL_SELF_CLOSE) + ',').find(',' + self.tagName + ',') < 0:
              self.children.append(VNode(html));
            else:
              self.closed = True;
              return 1;
          return
    else:
      self.nodeType = (3, 1)[html == '<'];
      self.inTag = html == '<';
      self.init = True;

    self.html += html;


class VirtualDOM:
  vnodes = [];

  def __init__(self, html):
    stream = html;
    streamIndex = 0;
    while len(stream):
      if len(self.vnodes) > 0 and self.vnodes[-1] and not self.vnodes[-1].closed:
        index = self.vnodes[-1].append(stream[0]) or 0;
        streamIndex += 1 - index;
        stream = html[streamIndex:];
      else:
        self.vnodes.append(VNode(stream[0]));
        streamIndex += 1;
        stream = html[streamIndex:];
    self.clean();

  def clean(self):
    print 'Clean';


html = '<div>HTML PARSER TO VIRTUAL DOM</div><p>By Clunt</p>';
html = '<div>h</div>';
virtualDOM = VirtualDOM(html)
print virtualDOM.vnodes
# print virtualDOM.vnodes[0].children[0].nodeType
# print json.dumps(virtualDOM.vnodes[0])
