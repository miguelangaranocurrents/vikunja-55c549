import type {Fragment, Node as ProseMirrorNode} from '@tiptap/pm/model'

// Plain text for copies out of the editor. ProseMirror's default flattens lists into
// bare lines, so bullets and numbers would be lost when pasting into a text field.

const LIST_NODE_NAMES = ['bulletList', 'orderedList', 'taskList']

function isList(node: ProseMirrorNode): boolean {
	return LIST_NODE_NAMES.includes(node.type.name)
}

function listItemMarker(list: ProseMirrorNode, index: number): string {
	switch (list.type.name) {
		case 'orderedList':
			return `${Number(list.attrs.start ?? 1) + index}. `
		case 'taskList':
			return list.child(index).attrs.checked ? '- [x] ' : '- [ ] '
		default:
			return '- '
	}
}

function serializeList(list: ProseMirrorNode): string {
	const lines: string[] = []

	list.content.forEach((item, _offset, index) => {
		const marker = listItemMarker(list, index)
		const indent = ' '.repeat(marker.length)
		// Children of a list item are one item's lines, so they are not separated by blank lines.
		serializeBlocks(item.content, true)
			.split('\n')
			.forEach((line, lineIndex) => {
				if (lineIndex === 0) {
					lines.push(marker + line)
				} else {
					lines.push(line === '' ? '' : indent + line)
				}
			})
	})

	return lines.join('\n')
}

function serializeBlock(node: ProseMirrorNode): string {
	if (isList(node)) {
		return serializeList(node)
	}

	if (node.isTextblock || node.isText) {
		return node.textContent
	}

	if (node.isLeaf) {
		return ''
	}

	return serializeBlocks(node.content, false)
}

function serializeBlocks(fragment: Fragment, tight: boolean): string {
	let text = ''

	fragment.content.forEach((node, _offset, index) => {
		if (index > 0) {
			const previous = fragment.content[index - 1]
			const adjacentLists = isList(previous) && isList(node)
			text += tight || adjacentLists ? '\n' : '\n\n'
		}
		text += serializeBlock(node)
	})

	return text
}

export function serializeClipboardText(fragment: Fragment): string {
	return serializeBlocks(fragment, false)
}
