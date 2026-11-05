import {describe, it, expect, afterEach, beforeEach} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import {ref} from 'vue'
import {Editor} from '@tiptap/core'

import {createEditorExtensions, type EditorExtensionDeps} from './editorExtensions'

window.API_URL = 'http://localhost:3456'

function createEditor(content: string) {
	const holder = document.createElement('div')
	document.body.appendChild(holder)

	let editor: Editor
	const deps: EditorExtensionDeps = {
		t: key => key,
		isEditing: ref(true),
		isEditEnabled: () => true,
		placeholder: '',
		contentHasChanged: ref(false),
		bubbleSave: () => {},
		getEditor: () => editor,
		uploadCallback: undefined,
		uploadAndInsertFiles: () => {},
	}

	editor = new Editor({element: holder, extensions: createEditorExtensions(deps), content})

	return editor
}

function copiedText(editor: Editor): string {
	return editor.view.serializeForClipboard(editor.state.doc.slice(0, editor.state.doc.content.size)).text
}

describe('editor copy as plain text', () => {
	let editor: Editor | undefined

	beforeEach(() => {
		setActivePinia(createPinia())
	})

	afterEach(() => {
		editor?.destroy()
		editor = undefined
		document.body.innerHTML = ''
	})

	it('keeps bullet markers of a list', () => {
		editor = createEditor('<p>start</p><ul><li><p>this</p></li><li><p>is</p></li></ul><p>end</p>')

		expect(copiedText(editor)).toBe('start\n\n- this\n- is\n\nend')
	})

	it('numbers an ordered list', () => {
		editor = createEditor('<ol><li><p>one</p></li><li><p>two</p></li></ol>')

		expect(copiedText(editor)).toBe('1. one\n2. two')
	})

	it('indents a nested list under its parent item', () => {
		editor = createEditor('<ul><li><p>parent</p><ul><li><p>child</p></li></ul></li></ul>')

		expect(copiedText(editor)).toBe('- parent\n  - child')
	})

	it('keeps plain paragraphs separated by blank lines', () => {
		editor = createEditor('<p>one</p><p>two</p>')

		expect(copiedText(editor)).toBe('one\n\ntwo')
	})
})
