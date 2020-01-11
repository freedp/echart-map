/**
 * 作者：Hyhello
 * 时间：2019-07-13
 * 描述：初始化
 */

// toUnicode
// const toUnicode = s => {
// 	if (typeof s !== 'string') return s;
// 	return s.replace(/[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/g, _ => {
// 		return `\\u${_.charCodeAt(0)
// 			.toString(16)
// 			.toUpperCase()}`;
// 	});
// };
const requireAll = requireContext => {
	const resource = {};
	requireContext.keys().forEach(item => {
		const src = item.replace(/(?:.*?)\/([\u4e00-\u9fa5\w-]+)\.json$/, '$1');
		const result = requireContext(item);
		resource[src] = 'default' in result ? result.default : result;
	});
	return resource;
};
const modules = requireAll(require.context('./map', true, /.*\.json$/));

export default modules;
