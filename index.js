const dataType = [
  {
    label: 'Object',
    value: 'Object'
  },
  {
    label: 'Array',
    value: 'Array'
  },
  {
    label: 'String',
    value: 'String'
  },
  {
    label: 'Number',
    value: 'Number'
  },
  {
    label: 'Boolean',
    value: 'Boolean'
  },
  {
    label: 'Null',
    value: 'Null'
  },
]
const booleanSelect = [
  {
    label: 'true',
    value: true
  },
  {
    label: 'false',
    value: false
  }
]

class JsonEdit {
  constructor (option) {
    this.dom = option.dom
    this.data = option.data || {
      a: '1',
      b: 2,
      c: [
        null,
        true,
        {
          d: 5
        }
      ],
      e: {
        f: [
          3,
          5
        ],
        g: false
      }
    }
    this.name = option.name || 'JSON文档的名字'
    this.viewDom = option.viewDom || document.createElement('pre')
  }

  init () {
    this.dom.innerHTML = ''
    const children = this.setDom(this.name, this.data, [])
    const style = document.createElement('style')
    style.innerText = `
      .item {
        padding: 10px 20px;
        border-left: 1px solid red;
        position: relative;
      }
      .item::before {
        content: '';
        height: 1px;
        width: 20px;
        position: absolute;
        left: 0px;
        top: 21px;
        background: red;
      }
      .item > *,
      .box-header > * {
        margin-right: 10px;
      }
      .box-foldIcon,
      .addIcon,
      .deleteIcon {
        height: 14px;
        width: 14px;
        line-height: 12px;
        text-align: center;
        color: white;
        position: absolute;
        cursor: pointer;
        border-radius: 50%;
      }
      .box-foldIcon {
        left: 2px;
        top: 25px;
        background: black;
      }
      .key::before {
        content: 'key';
        position: absolute;
        left: 0px;
        top: 0px;
      }
      .addIcon {
        left: 13.5px;
        bottom: -4px;
        background: green;
      }
      .deleteIcon {
        position: relative;
        background: red;
        display: inline-block;
      }
    `
    this.repaintViewDom()
    this.dom.appendChild(this.viewDom)
    this.dom.appendChild(children)
    this.dom.appendChild(style)
  }

  /**
   * 根据数据渲染json结构
   * @param {String} name - 数据的key
   * @param {*} data - 渲染的数据
   * @param {Array} path - 当前的路径
   * @param {String} parentType - 父级数据的类型(会影响当前的展示)
   */
  setDom (name, data, path, parentType) {
    const type = this.getTypeOf(data)
    const dom = document.createElement('div')

    if (type === 'Array' || type === 'Object') {
      // 把数组和对象的子元素集结起来
      const childrenListDom = document.createElement('div')
      childrenListDom.className = 'box-child'
      const childrenList = document.createDocumentFragment();
      for (const key in data) {
        const children = this.setDom(key, data[key], [...path, key], type)
        childrenList.appendChild(children)
      }
      childrenListDom.appendChild(childrenList)

      // 数组和对象的当前元素单独用个div包裹
      const itemDom = document.createElement('div')
      const control = this.createControl(name, data, path, parentType)
      itemDom.appendChild(control)
      itemDom.className = `box-header`

      // 数组和对象的折叠按钮
      const foldIcon = document.createElement('div')
      foldIcon.innerText = '-'
      foldIcon.className = `box-foldIcon`
      foldIcon.addEventListener('click', function() {
        if (childrenListDom.hidden) {
          this.innerText = '-'
          childrenListDom.hidden = false
        } else {
          this.innerText = '+'
          childrenListDom.hidden = true
        }
      })

      // 数组和对象的下面可以进行添加
      const addDom = this.setAddDom()
      addDom.addEventListener('click', () => {
        if (type === 'Array') {
          data.push('')
        } else if (type === 'Object') {
          data[new Date().getTime()] = ''
        }
        this.resetDom()
        this.repaintViewDom()
      })
      childrenListDom.appendChild(addDom)
      
      dom.appendChild(foldIcon)
      dom.appendChild(itemDom)
      dom.appendChild(childrenListDom)
    } else {
      // 如果当前元素是非数组对象的话就直接用起来
      const control = this.createControl(name, data, path, parentType)
      dom.appendChild(control)
    }
    dom.className = `item`
    dom.setAttribute('id', `box-data-${path.join('-')}`)
    return dom
  }

  /**
   * 渲染单个数据的结构
   * @param {String/Number} key - 数据的key
   * @param {*} value - 数据的值
   * @param {Array} path - 当前的路径
   * @param {String}} - parentType 数据的父级类型
   */
  createControl (key, value, path, parentType) {
    const type = this.getTypeOf(value)
    const control = document.createDocumentFragment()

    // 结构的构建
    // key的结构
    const keyDom = this.setInputDom(key, 'key')
    // type的结构
    const typeDom = this.setSelectDom(dataType, type, 'type')
    // value结构
    let valueDom = null
    // 如果类型是布尔,value是下拉
    if (type === 'Boolean') {
      valueDom = this.setSelectDom(booleanSelect, value, 'value')
    // 如果非数组对象,渲染value的结构
    } else if (type !== 'Array' && type !== 'Object') {
      valueDom = this.setInputDom(value, 'value')
    }

    // 所有元素后面可以进行删除
    const delDom = this.setDeleteDom()
    const parent = this.findItemByPath(this.data, path.slice(0, -1))
    delDom.addEventListener('click', () => {
      if (this.getTypeOf(parent) === 'Array') {
        parent.splice(key, 1)
      } else {
        delete parent[key]
      }
      this.resetDom()
      this.repaintViewDom()
    })

    // 设置一些特殊情况
    // 如果父级是数组就不可更改
    if (parentType === 'Array') {
      keyDom.setAttribute('disabled', 'true')
    }
    // 如果当前是null就不能改value
    if (type === 'Null') {
      valueDom.value = 'null'
      valueDom.setAttribute('disabled', 'true')
    }
    // 如果当前是number输入框就只能是数字
    if (type === 'Number') {
      valueDom.setAttribute('type', 'number')
    }

    // 添加监听
    // 监听key的修改
    keyDom.addEventListener('change', e => {
      e.target.value && this.changeJson(path, {
        key: e.target.value
      })
    })
    // 监听type的修改
    typeDom.addEventListener('change', e => {
      e.target.value && this.changeJson(path, {
        type: e.target.value
      })
    })
    // 监听value的修改
    valueDom && valueDom.addEventListener('change', e => {
      e.target.value && this.changeJson(path, {
        value: e.target.value
      })
    })

    // 挂载
    control.appendChild(keyDom)
    control.appendChild(typeDom)
    valueDom && control.appendChild(valueDom)
    // 非根节点才可以删除
    path.length !== 0 && control.appendChild(delDom)
    return control
  }

  /**
   * 修改json数据
   * @param {Array} path - 修改的路径
   * @param {Object} data - 替换的项目
   */
  changeJson (path, data) {
    // 如果路径是空的话,说明改的是最外层的,得特殊处理
    if (path.length === 0) {
      // 进行key的替换
      if (data.key) {
        this.name = data.key
      }
      // 进行type的替换
      if (data.type) {
        if (data.type === 'String') {
          this.data = ''
        } else if (data.type === 'Number') {
          this.data = 0
        } else if (data.type === 'Null') {
          this.data = null
        } else if (data.type === 'Boolean') {
          this.data = true
        } else if (data.type === 'Array') {
          this.data = []
        } else if (data.type === 'Object') {
          this.data = {}
        }
        this.resetDom()
      }
      // 进行value的替换
      if (data.value) {
        const type = this.getTypeOf(this.data)
        console.log(type);
        console.log(data.value);
        // 因为输入框里面只能是字母
        if (type === 'Number') {
          this.data = Number(data.value)
        } else if (type === 'Boolean') {
          this.data = data.value === 'true'
        } else {
          this.data = data.value
        }
      }
      this.repaintViewDom()
      return
    }

    const itemDom = this.dom.querySelector(`#box-data-${path.join('-')}`)
    const parent = this.findItemByPath(this.data, path.slice(0, -1))
    const key = path[path.length - 1]
    // 进行key的替换, 还需要这个key没有重复
    if (data.key && parent[data.key] === undefined) {
      parent[data.key] = parent[key]
      delete parent[key]
      // 因为key修改后暂时只影响了当前的id,所以只要改一下id就好
      itemDom.setAttribute('key', `box-data-${path.slice(0, -1).join('-')}-${data.key}`)
    }

    // 进行type的替换
    if (data.type) {
      if (data.type === 'String') {
        parent[key] = ''
      } else if (data.type === 'Number') {
        parent[key] = 0
      } else if (data.type === 'Null') {
        parent[key] = null
      } else if (data.type === 'Boolean') {
        parent[key] = true
      } else if (data.type === 'Array') {
        parent[key] = []
      } else if (data.type === 'Object') {
        parent[key] = {}
      }
      // 暂时是全部更新,优化可以考虑局部更新
      this.resetDom()
    }

    // 进行value的替换
    if (data.value) {
      const type = this.getTypeOf(parent[key])
      // 因为输入框里面只能是字母
      if (type === 'Number') {
        parent[key] = Number(data.value)
      } else if (type === 'Boolean') {
        this.data = data.value === 'false' ? false : true
      } else {
        parent[key] = data.value
      }
    }
    this.repaintViewDom()
  }

  /**
   * 重新绘制json展示的dom
   */
  repaintViewDom () {
    this.viewDom.innerText = this.name + ': ' + JSON.stringify(this.data, null, 4)
  }

  /**
   * 通过路径找到当前节点
   * @param {*} data - 找路径的根节点
   * @param {Array} path - 节点路径
   */
  findItemByPath (data, path) {
    let item = data
    for (let i = 0; i < path.length; i++) {
      item = item[path[i]]
    }
    return item
  }

  /**
   * 判断数据类型
   * @param {*} value - 判断的数据
   */
  getTypeOf (value) {
    return Object.prototype.toString.call(value).slice(8, -1)
  }

  /**
   * 渲染输入框组件
   * @param {*} value - 下拉默认值
   */
  setInputDom (value, type) {
    const input = document.createElement('input')
    input.value = value
    input.className = type
    return input
  }

  /**
   * 添加的按钮
   */
  setAddDom () {
    const add = document.createElement('div')
    add.className = 'addIcon'
    add.innerText = '+'
    return add
  }

  /**
   * 删除的按钮
   */
  setDeleteDom () {
    const del = document.createElement('div')
    del.className = 'deleteIcon'
    del.innerText = '-'
    return del
  }

  /**
    * 渲染下拉框组件
    * @param {Array} options - 下拉参数
    * @param {*} value - 下拉默认值
    */
   setSelectDom (options, value, type) {
    const select = document.createElement('select')
    let html = ''
    for (let i = 0; i < options.length; i++) {
      html += `<option value="${options[i].value}">${options[i].label}</option>`
    }
    select.innerHTML = html
    select.value = value
    select.className = type
    return select
  }

  /**
   * 全量更新dom节点
   */
  resetDom () {
    // 暂时是全部更新,优化可以考虑局部更新
    this.dom.querySelector('#box-data-').remove()
    const children = this.setDom(this.name, this.data, [])
    this.dom.appendChild(children)
  }
}

export default JsonEdit