import {convertPaintColor, convertPaintName} from '../app/utils/colorUtils';
import {
  GET_CONFIG_MESSAGE,
  GITHUB_CONFIG,
  NETWORK_REQUEST,
} from '../app/constants';
import {File} from '../app/utils/githubUtils';

type TextStyle = {
  [key: string]: {
    fontName: FontName;
    fontSize: number;
    textCase: TextCase;
    textDecoration: TextDecoration;
    letterSpacing: LetterSpacing;
    lineHeight: LineHeight;
  };
};

type ColorStyle = {
  [key: string]: string;
};

type IconStyle = {
  name: string;
  path: VectorPaths;
  paints: any;
  width: number;
  height: number;
};

type Styles = {
  colors: ColorStyle;
  textStyles: TextStyle[];
  iconStyles: IconStyle[];
};

type NodeToSvgFileConverter = (nodes: SceneNode[]) => Promise<File[]>;
const convertNodeToSvgFile: NodeToSvgFileConverter = nodes => {
  return Promise.all(
    nodes.map(node =>
      node.exportAsync({format: 'SVG'}).then((svg: Uint8Array) => {
        // @ts-ignore
        const str = String.fromCharCode.apply(null, svg);
        let svgFile = str.replace(/"/g, "'");
        return {
          path: `packages/common/src/assets/dsIcons/${node.name}.svg`,
          content: svgFile.replace(/\n/g, ''),
        };
      })
    )
  );
};

type NodeToColorsFileConverter = (paints: PaintStyle[]) => File[];
const convertNodeToColorsFile: NodeToColorsFileConverter = paints => {
  const colors = paints.reduce(
    (acc, {name, paints: [paint]}) => ({
      ...acc,
      [convertPaintName(name)]: convertPaintColor(paint).colorCode || '',
    }),
    {}
  );
  return [
    {
      path: 'packages/common/src/assets/ds.json',
      content: JSON.stringify({colors}, null, 2),
    },
  ];
};

figma.showUI(__html__, {width: 600, height: 500});

figma.ui.onmessage = msg => {
  if (msg.type === GET_CONFIG_MESSAGE) {
    figma.clientStorage.getAsync('config').then(config => {
      figma.ui.postMessage({type: GITHUB_CONFIG, config: JSON.parse(config)});
    });
  }
  if (msg.type === 'send') {
    figma.clientStorage.setAsync('config', JSON.stringify(msg.config));
    let styles = {} as Styles;

    // Get text styles changes
    // TODO: waiting for formatting
    styles.textStyles = figma.getLocalTextStyles().map(style => {
      return {
        [style.name]: {
          fontName: style.fontName,
          fontSize: style.fontSize,
          textCase: style.textCase,
          textDecoration: style.textDecoration,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight,
        },
      };
    });

    // Get colors
    const paints = figma.getLocalPaintStyles();
    if (paints.length) {
      const colors = convertNodeToColorsFile(paints);
      figma.ui.postMessage({
        type: NETWORK_REQUEST,
        content: colors,
        config: msg.config,
      });
    }

    // Get svg icons
    const nodes = figma.currentPage.findAll(node => node.type === 'COMPONENT');
    convertNodeToSvgFile(nodes).then(commits =>
      figma.ui.postMessage({
        type: NETWORK_REQUEST,
        content: commits,
        config: msg.config,
      })
    );
  }
  if (msg.type === 'done') {
    figma.closePlugin();
  }
};
