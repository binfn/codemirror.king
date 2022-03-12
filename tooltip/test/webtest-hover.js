var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import ist from "ist";
import { hoverTooltip } from "@codemirror/tooltip";
function waitForSuccess(assert) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < 20; i++) {
            yield new Promise(resolve => setTimeout(() => resolve(), 50));
            try {
                assert();
                return;
            }
            catch (_a) {
            }
        }
        // final try
        assert();
    });
}
function setupHover(...tooltips) {
    const testText = "test";
    const hoverTooltips = tooltips.map(x => {
        const { text, start, end } = typeof x === "string"
            ? { text: x, start: 0, end: testText.length - 1 }
            : x;
        return hoverTooltip((_, pos) => {
            if (pos < start || pos > end)
                return null;
            return { pos, create: () => {
                    const dom = document.createElement("div");
                    dom.innerText = text;
                    return { dom };
                } };
        }, { hoverTime: 10 });
    });
    const root = document.body.querySelector("#workspace");
    return new EditorView({ state: EditorState.create({ doc: testText, extensions: hoverTooltips }), parent: root });
}
function mouseMove(view, pos = 0) {
    const line = view.dom.querySelector(".cm-line");
    const { top, left } = view.coordsAtPos(pos);
    line.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: left + 1, clientY: top + 1 }));
}
function expectTooltip(view, html) {
    return waitForSuccess(() => {
        const tooltip = view.dom.querySelector(".cm-tooltip");
        ist(tooltip);
        ist(tooltip.classList.contains("cm-tooltip"));
        ist(tooltip.classList.contains("cm-tooltip-hover"));
        ist(tooltip.innerHTML, html);
    });
}
describe("hoverTooltip", () => {
    it("renders one tooltip view in container", () => __awaiter(void 0, void 0, void 0, function* () {
        let view = setupHover("test");
        mouseMove(view);
        yield expectTooltip(view, '<div class="cm-tooltip-section">test</div>');
        view.destroy();
    })),
        it("renders two tooltip views in container", () => __awaiter(void 0, void 0, void 0, function* () {
            let view = setupHover("test1", "test2");
            mouseMove(view);
            yield expectTooltip(view, '<div class="cm-tooltip-section">test1</div>' +
                '<div class="cm-tooltip-section">test2</div>');
            view.destroy();
        }));
    it("adds tooltip view if mouse moves into the range", () => __awaiter(void 0, void 0, void 0, function* () {
        let view = setupHover({ text: "add", start: 2, end: 4 }, { text: "keep", start: 0, end: 4 });
        mouseMove(view, 0);
        yield expectTooltip(view, '<div class="cm-tooltip-section">keep</div>');
        mouseMove(view, 3);
        yield expectTooltip(view, '<div class="cm-tooltip-section">add</div>'
            + '<div class="cm-tooltip-section">keep</div>');
        view.destroy();
    }));
    it("removes tooltip view if mouse moves outside of the range", () => __awaiter(void 0, void 0, void 0, function* () {
        let view = setupHover({ text: "remove", start: 0, end: 2 }, { text: "keep", start: 0, end: 4 });
        mouseMove(view, 0);
        yield expectTooltip(view, '<div class="cm-tooltip-section">remove</div>' +
            '<div class="cm-tooltip-section">keep</div>');
        mouseMove(view, 3);
        yield expectTooltip(view, '<div class="cm-tooltip-section">keep</div>');
        view.destroy();
    }));
});
