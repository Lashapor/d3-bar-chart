class Chart {
  constructor() {
    // Defining state attributes
    const attrs = {
      id: "ID" + Math.floor(Math.random() * 1000000),
      svgWidth: 500,
      svgHeight: 500,
      marginTop: 40,
      marginBottom: 5,
      marginRight: 300,
      marginLeft: 5,
      container: "body",
      defaultTextFill: "#2C3E50",
      defaultFont: "Helvetica",
      data: null,
      chartWidth: null,
      chartHeight: null,
      firstRender: true,
      guiEnabled: false,
    };

    // Defining accessors
    this.getState = () => attrs;
    this.setState = (d) => Object.assign(attrs, d)

    // Automatically generate getter and setters for chart object based on the state properties;
    Object.keys(attrs).forEach((key) => {
      //@ts-ignore
      this[key] = function (_) {
        if (!arguments.length) {
          return attrs[key];
        }
        attrs[key] = _;
        return this;
      }
    });

    // Custom enter exit update pattern initialization (prototype method)
    this.initializeEnterExitUpdatePattern();
  }

  render() {
    this.addChartGui();
    this.setDynamicContainer()
    this.calculateProperties();
    this.drawSvgAndWrappers();
    this.drawBarChart();
    return this;
  }

  calculateProperties() {
    const {
      marginLeft,
      marginTop,
      marginRight,
      marginBottom,
      svgWidth,
      svgHeight
    } = this.getState();

    // Calculated properties
    let calc = {
      id: null,
      chartTopMargin: null,
      chartLeftMargin: null,
      chartWidth: null,
      chartHeight: null,
    };
    calc.id = "ID" + Math.floor(Math.random() * 1000000); // id for event handlings
    calc.chartLeftMargin = marginLeft;
    calc.chartTopMargin = marginTop;
    const chartWidth = svgWidth - marginRight - calc.chartLeftMargin;
    const chartHeight = svgHeight - marginBottom - calc.chartTopMargin;

    this.setState({ calc, chartWidth, chartHeight })
  }

  drawBarChart() {
    const { chart, data, chartWidth, chartHeight } = this.getState();

    console.log({ data: data })

    let valueSum = d3.sum(data, (d) => d.value)

    let gInitial = chart.selectAll('g.row').data(data, (d) => d.key)

    const gEnter = gInitial.enter().append('g')

    const gExit = gInitial.exit();
    const g = gEnter.merge(gInitial)

    g.attr('clas', 'row')

    gExit
      .transition()
      .duration(500)
      .attr('transform', (d, i, arr) => `translate(-1000,${50 + 25 * i})`)
      .on('end', function () {
        d3.select(this).remove();
      })

    gEnter.attr('transform', (d, i, arr) => `translate(1000,${50 + 25 * i})`)

    g.transition()
      .duration(1000)
      .attr('transform', (d, i, arr) => `translate(10,${50 + 25 * i})`)

    g.selectAll('text.keys')
      .data((d) => [d])
      .join('text')
      .text((d) => d.key)
      .attr('class', 'keys')
      .attr('y', 16)
      .attr('text-anchor', 'end')
      .attr('x', 140)

    const maxValue = d3.max(data, d => d.value)

    const xScale = d3.scaleLinear().domain([0, maxValue]).range([0, chartWidth])

    g
      .selectAll("rect.bars")
      .data((d) => [d])
      .join("rect")
      .attr("class", "bars")
      .attr("height", 20)
      .attr("fill", "darkblue")
      .attr("x", 150)
      .transition()
      .duration(1000)
      .delay((d, i, arr) => 1000 + i * 100)
      .attr("width", (d) => {
        return xScale(d.value)
      })

    g.selectAll('text.percents')
      .data((d) => [d])
      .join('text')
      .attr('class', 'percents')
      .text((d) => {
        const p = Math.round((d.value / valueSum) * 100 * 10) / 10
        return p + '%'
      })
      .attr('font-size', 11)
      .attr('y', 16)
      .attr('x', function () {
        const current = d3.select(this).attr('x');
        return current || 155;
      })
      .transition()
      .duration(1000)
      .delay((d, i, arr) => 1000 + i * 100)
      .attr('x', (d) => {
        return 150 + xScale(d.value) + 5
      })
  }

  drawSvgAndWrappers() {
    const {
      d3Container,
      svgWidth,
      svgHeight,
      defaultFont,
      calc,
      data,
      chartWidth,
      chartHeight
    } = this.getState();

    // Draw SVG
    const svg = d3Container
      ._add({
        tag: "svg",
        className: "svg-chart-container"
      })
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("font-family", defaultFont);

    // Add container g element
    let chart = svg
      ._add({
        tag: "g",
        className: "chart"
      })
      .attr(
        "transform",
        "translate(" + calc.chartLeftMargin + "," + calc.chartTopMargin + ")"
      );

    this.setState({ chart, svg })
  }

  initializeEnterExitUpdatePattern() {
    d3.selection.prototype._add = function (params) {
      let container = this;
      let className = params.className;
      let elementTag = params.tag;
      let data = params.data || [className];
      let exitTransition = params.exitTransition || null;
      let enterTransition = params.enterTransition || null;
      // Pattern in action
      let selection = container.selectAll("." + className).data(data, (d, i) => {
        if (typeof d === "object") {
          if (d.id) {
            return d.id
          }
        }
        return i;
      });
      if (exitTransition) {
        exitTransition(selection);
      } else {
        selection.exit().remove();
      }

      const enterSelection = selection.enter().append(elementTag);
      if (enterTransition) {
        enterTransition(enterSelection);
      }
      selection = enterSelection.merge(selection);
      selection.attr("class", className);
      return selection;
    };
  }

  setDynamicContainer() {
    const attrs = this.getState();

    // Drawing contaienrs
    let d3Container = d3.select(attrs.container);
    let containerRect = d3Container.node().getBoundingClientRect();
    // if (containerRect.width > 0) attrs.svgWidth = containerRect.width;

    d3.select(window).on("resize." + attrs.id, () => {
      let containerRect = d3Container.node().getBoundingClientRect();
      if (containerRect.width > 0) attrs.svgWidth = containerRect.width;
      this.render();
    })

    this.setState({ d3Container })
  }

  addChartGui() {
    const { guiEnabled, firstRender } = this.getState()
    // console.log({ guiEnabled, firstRender })
    if (!guiEnabled || !firstRender) return;
    if (typeof lil == 'undefined') return;
    const gui = new lil.GUI()
    gui.close()
    const state = JSON.parse(JSON.stringify(this.getState()))
    const propChanged = () => {
      supportedKeys.forEach(k => {
        this.setState({ [k]: state[k] })
      })
      this.render();
    }
    const supportedKeys = Object.keys(state)
      .filter(k =>
        typeof state[k] == 'number' ||
        typeof state[k] == 'string' ||
        typeof state[k] == 'boolean'

      )
      .filter(d => !['guiEnabled', 'firstRender'].includes(d))
    // console.log({ supportedKeys, state })
    supportedKeys.forEach(key => {
      gui.add(state, key).onChange(d => {
        propChanged();
      })
    })
  }

}