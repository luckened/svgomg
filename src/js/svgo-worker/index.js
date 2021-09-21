import { optimize } from 'svgo/dist/svgo.browser';

const createDimensionsExtractor = () => {
  const dimensions = {};
  const plugin = {
    type: 'visitor',
    name: 'extract-dimensions',
    fn: () => {
      return {
        element: {
          enter: ({ name, attributes }, { type }) => {
            if (name === 'svg' && type === 'root') {
              if (attributes.width != null && attributes.height !== null) {
                dimensions.width = Number.parseFloat(attributes.width);
                dimensions.height = Number.parseFloat(attributes.height);
              } else if (attributes.viewBox != null) {
                const viewBox = attributes.viewBox.split(/,\s*|\s+/);
                dimensions.width = Number.parseFloat(viewBox[2]);
                dimensions.height = Number.parseFloat(viewBox[3]);
              }
            }
          }
        }
      };
    }
  };
  return [dimensions, plugin];
};

const compress = (svgInput, settings) => {
  // setup plugin list
  const floatPrecision = Number(settings.floatPrecision);
  const plugins = [];

  for (const [name, active] of Object.entries(settings.plugins)) {
    if (!active) continue;

    const plugin = {
      name,
      params: {}
    };

    // 0 almost always breaks images when used on `cleanupNumericValues`.
    // Better to allow 0 for everything else, but switch to 1 for this plugin.
    plugin.params.floatPrecision = plugin.name === 'cleanupNumericValues' && floatPrecision === 0 ?
      1 :
      floatPrecision;

    plugins.push(plugin);
  }

  // multipass optimization
  const [dimensions, extractDimensionsPlugin] = createDimensionsExtractor();
  const { data, error } = optimize(svgInput, {
    multipass: settings.multipass,
    plugins: [...plugins, extractDimensionsPlugin],
    js2svg: {
      indent: '  ',
      pretty: settings.pretty
    }
  });

  if (error) throw new Error(error);

  return { data, dimensions };
};

const actions = {
  wrapOriginal({ data }) {
    const [dimensions, extractDimensionsPlugin] = createDimensionsExtractor();
    const { error } = optimize(data, {
      plugins: [extractDimensionsPlugin],
    });

    if (error) throw new Error(error);

    return dimensions;
  },
  process({ data, settings }) {
    return compress(data, settings);
  },
};

self.onmessage = ({ data }) => {
  try {
    self.postMessage({
      id: data.id,
      result: actions[data.action](data)
    });
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error.message
    });
  }
};
