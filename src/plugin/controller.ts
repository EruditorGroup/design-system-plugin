import {convertPaintColor, convertPaintName} from '../app/utils/colorUtils';
import {File} from '../app/utils/githubUtils';
import {lowerFirstLetter} from '../app/utils/stringUtils';

const SYSTEM_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', " +
  "Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', " +
  "'Segoe UI Emoji', 'Segoe UI Symbol'";

type NodeToSvgFileConverter = (nodes: SceneNode[]) => Promise<File[]>;
const convertNodeToSvgFile: NodeToSvgFileConverter = nodes => {
  return Promise.all(
    nodes.map(node =>
      node.exportAsync({format: 'SVG'}).then((svg: Uint8Array) => {
        // @ts-ignore
        const str = String.fromCharCode.apply(null, svg);
        const svgFile = str.replace(/"/g, "'");
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
      path: 'packages/common/src/assets/colors.json',
      content: JSON.stringify({colors}, null, 2),
    },
  ];
};

type TextStylesToTypographyConverter = (textStyles: TextStyle[]) => File[];
const convertTextStylesToTypography: TextStylesToTypographyConverter = textStyles => {
  console.log(textStyles);
  const fonts = textStyles.reduce(
    (acc, text) => ({
      ...acc,
      [lowerFirstLetter(text.name.split('/')[1].split(' · ')[0])]: {
        ...acc[lowerFirstLetter(text.name.split('/')[1].split(' · ')[0])],
        [lowerFirstLetter(text.name.split('/')[1].split(' · ')[1])]: {
          fontFamily: SYSTEM_FONT_FAMILY,
          lineHeight: text.lineHeight?.value + 'px' || '',
          letterSpacing: text.letterSpacing.value.toFixed(2) + 'px',
          fontSize: text.fontSize,
        },
      },
    }),
    {}
  );
  const weight = {
    bold: 'bold',
    medium: '500',
    regular: 'normal',
  };

  return [
    {
      path: 'packages/common/src/assets/fonts.json',
      content: JSON.stringify({fonts, weight}, null, 2),
    },
  ];
};

figma.showUI(__html__, {width: 600, height: 500});

figma.ui.onmessage = msg => {
  if (msg.type === 'GET_CONFIG_MESSAGE') {
    figma.clientStorage.getAsync('config').then(config => {
      figma.ui.postMessage({type: 'GITHUB_CONFIG', config: JSON.parse(config)});
    });
  }
  if (msg.type === 'send') {
    figma.clientStorage.setAsync('config', JSON.stringify(msg.config));

    // Get typography
    const textStyles = figma.getLocalTextStyles();
    if (textStyles.length) {
      const typography = convertTextStylesToTypography(textStyles);
      figma.ui.postMessage({
        type: 'NETWORK_REQUEST',
        content: typography,
        config: msg.config,
      });
    }

    // // Get colors
    const paints = figma.getLocalPaintStyles();
    if (paints.length > 1) {
      const colors = convertNodeToColorsFile(paints);
      figma.ui.postMessage({
        type: 'NETWORK_REQUEST',
        content: colors,
        config: msg.config,
      });
    }

    // Get svg icons
    const nodes = figma.currentPage.findAll(node => node.type === 'COMPONENT');
    convertNodeToSvgFile(nodes).then(commits =>
      figma.ui.postMessage({
        type: 'NETWORK_REQUEST',
        content: commits,
        config: msg.config,
      })
    );
  }
};
