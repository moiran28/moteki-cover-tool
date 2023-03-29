/*
Here is the original copyright notice for EaselJS:

The MIT License (MIT)

Copyright (c) 2014 gskinner.com, inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// 現代版
const M_PLUS_ROUNDED = 'M PLUS Rounded 1c';
const GENDAI_DOWNLOAD_IMAGE_NAME = 'gendai_cover_image';
// 大正版
const KAISEI_HARUNOUMI = 'Kaisei HarunoUmi';
const TAISYO_DOWNLOAD_IMAGE_NAME = 'taisyo_cover_image';

// Text.name
const NAME_TEXT = 'nameText';
const MOTEKI_TEXT = 'motekiText';

class FontSetting {
    constructor({ familyName = '', size, color }) {
        this.familyName = familyName;
        this.size = size;
        this.color = color;
    }
    get pxSize() {
        return `${this.size}px`;
    }
    get sizeAndFamilyName() {
        return `${this.pxSize} '${this._familyName}'`;
    }
    set familyName(newName) {
        this._familyName = newName;
    }
    get familyName() {
        return this._familyName;
    }
}

/**
 * createjs.Stage拡張クラス
 */
class StageEx extends createjs.Stage {
    _background;
    /**
     * @param {*} canvasId
     * @param {*} imgToUpdate ステージアップデート時に更新するimg要素
     */
    constructor(canvasId, imgToUpdate) {
        super(canvasId);
        this.imgToUpdate = imgToUpdate;
        this.setTmpBackgroud();
    }
    set background(newImage) {
        this.removeChild(this._background);
        this._background = newImage;
        this.addChild(this._background);
        this.setChildIndex(this._background, 0);
        this.update();
    }
    setBackgroundImage(imageData) {
        const image = new Image();
        image.src = imageData;
        image.onload = () => {
            this.background = new createjs.Bitmap(image);
        };
        image.onerror = () => {
            setErrorText("画像の読み込みに失敗しました。");
        };
    }
    setTmpBackgroud() {
        const tmpBackgroud = new createjs.Shape();
        tmpBackgroud.graphics.beginFill("black");
        tmpBackgroud.graphics.drawRect(0, 0, this.canvas.width, this.canvas.height);
        this.background = tmpBackgroud;
    }
    addChild(child) {
        if (child instanceof VerticalText) {
            child.stage = this;
            child.characters.forEach(c => {
                super.addChild(c);
            });
        } else {
            super.addChild(child);
        }
    }
    update() {
        super.update();
        this.imgToUpdate.src = this.canvas.toDataURL('image/png');
    }
}

/**
 * 横書きのテキストクラス
 */
class HorizontalText extends createjs.Text {
    constructor(text, fontSetting) {
        super(text, fontSetting.sizeAndFamilyName, fontSetting.color);
        this.text = text;
    }
}

/**
 * 縦書きのテキストクラス
 */
class VerticalText {
    characters = [];
    x = 0;
    y = 0;
    stage;
    maxHeight;
    constructor(text, fontSetting, x, y) {
        this.fontSetting = fontSetting;
        this.text = text;
        this.x = x + fontSetting.size / 2;
        this.y = y;
        this.fontFamilyName = fontSetting.familyName;
    }
    set text(newText) {
        if (this.stage) {
            this.characters.forEach(c => {
                this.stage.removeChild(c);
            })
        }
        this.removeCharacters();
        this.addCharacters(newText);
        if (this.stage) {
            this.stage.addChild(this);
        }
    }
    addCharacters(newText) {
        const textCharacters = newText.split('');
        let adjustedFontSize = (this.maxHeight) && (this.maxHeight < this.fontSetting.size * textCharacters.length)
            ? this.maxHeight / textCharacters.length
            : this.fontSetting.size;
        for (let index = 0; index < textCharacters.length; index++) {
            const char = new createjs.Text(textCharacters[index], `${adjustedFontSize}px ${this.fontSetting.familyName}`, this.fontSetting.size);
            if (textCharacters[index] == 'ー') {
                char.x = this.x
                char.y = this.y + (adjustedFontSize * index) - (char.getBounds().height / 2);
                char.regX = char.getBounds().width / 2;
                char.regY = char.getBounds().width / 2;
                char.rotation = 90;
            } else {
                char.textAlign = 'center';
                char.textBaseline = 'ideographic';
                char.x = this.x;
                char.y = this.y + adjustedFontSize * index;
            }
            this.characters.push(char);
        }
    }
    removeCharacters() {
        this.characters = [];
    }
}

/**
 * フォントのLoadingアニメーション
 */
class FontLoadingAnimation {
    constructor(elementId) {
        this.element = document.querySelector(`#${elementId}`);
        this.loader = this.element.querySelector(".loader");
        this.text = this.element.querySelector(".loadText");
    }
    start() {
        this.element.classList.replace('hide', 'show');
    }
    end() {
        this.loader.classList.add('hide');
        this.text.textContent = '✅ フォント読み込み完了';
    }
    error() {
        this.text.textContent = '❌ フォント読み込み失敗';
    }
}

// フォント
const gendaiFontSetting = new FontSetting({ familyName: M_PLUS_ROUNDED, size: 120, color: 'rgb(256, 256, 256)' });
const taisyoFontSetting = new FontSetting({ familyName: KAISEI_HARUNOUMI, size: 120, color: 'rgb(256, 256, 256)' });

const init = () => {
    // 現代版
    initGendaiBlock();

    // 大正版
    initTaisyoBlock()
}

function initGendaiBlock() {
    const gendaiImg = document.querySelector('#gendaiCanvasImage');
    const gendaiDownloadStage = new StageEx('gendaiDownloadCanvas', gendaiImg);

    const gendaiFontLoadingAnimation = new FontLoadingAnimation('gendaiCoverLoading');
    fontLoad(gendaiFontSetting, gendaiDownloadStage, gendaiFontLoadingAnimation);

    const gendaiImageInput = document.querySelector('#gendaiImageInput');
    const gendaiFileErrorMessage = document.querySelector('#gendaiFileErrorMessage');
    initFileInput(gendaiImageInput, gendaiDownloadStage, gendaiFileErrorMessage);

    initGendaiCover(gendaiDownloadStage);
}

// 現代版トレーラー
function initGendaiCover(gendaiDownloadStage) {
    const gendaiNameInput = document.querySelector('#gendaiNameInput');
    const gendaiNameInputButton = document.querySelector('#gendaiNameInputButton');

    // 探索者、
    const nameText = new HorizontalText('', gendaiFontSetting);
    nameText.textBaseline = 'ideographic';
    nameText.x = 500;
    nameText.y = 260;
    gendaiDownloadStage.addChild(nameText);
    // モテ期襲来
    const motekiText = new HorizontalText('モテ期襲来', gendaiFontSetting);
    motekiText.textBaseline = 'ideographic';
    motekiText.x = 500;
    motekiText.y = 380;
    gendaiDownloadStage.addChild(motekiText);

    gendaiDownloadStage.update();
    const updateName = () => {
        nameText.text = gendaiNameInput.value;
        gendaiDownloadStage.update();
    }
    inputInit(gendaiNameInput, updateName);
    inputButtonInit(gendaiNameInputButton, updateName);
}

function initTaisyoBlock() {
    const taisyoImg = document.querySelector('#taisyoCanvasImage');
    const taisyoDownloadStage = new StageEx('taisyoDownloadCanvas', taisyoImg);

    const taisyoFontLoadingAnimation = new FontLoadingAnimation('taisyoCoverLoading');
    fontLoad(taisyoFontSetting, taisyoDownloadStage, taisyoFontLoadingAnimation);

    const taisyoImageInput = document.querySelector('#taisyoImageInput');
    const taisyoFileErrorMessage = document.querySelector('#taisyoFileErrorMessage');
    initFileInput(taisyoImageInput, taisyoDownloadStage, taisyoFileErrorMessage);

    initTaisyoCover(taisyoDownloadStage);
}

//大正版トレーラー
function initTaisyoCover(taisyoDownloadStage) {
    const taisyoNameInput = document.querySelector('#taisyoNameInput');
    const taisyoNameInputButton = document.querySelector('#taisyoNameInputButton');
    // 探索者、
    const nameText = new HorizontalText('', taisyoFontSetting);
    nameText.textBaseline = 'ideographic';
    nameText.x = 500;
    nameText.y = 260;
    taisyoDownloadStage.addChild(nameText);
    // モテ期襲来
    const motekiText = new HorizontalText('モテ期襲来', taisyoFontSetting);
    motekiText.textBaseline = 'ideographic';
    motekiText.x = 500;
    motekiText.y = 380;
    taisyoDownloadStage.addChild(motekiText);
    taisyoDownloadStage.update();

    const updateName = () => {
        nameText.text = taisyoNameInput.value;
        taisyoDownloadStage.update();
    }
    inputInit(taisyoNameInput, updateName);
    inputButtonInit(taisyoNameInputButton, updateName);
}

// 共通
/**
 * Googleフォントの読み込み
 * @param {FontSetting} fontToUpdate 更新するフォント
 * @param {StageEx} stageUsingFont フォントを使用しているStage
 * @param {FontLoadingAnimation} loadingAnimation フォント更新状況に表示するアニメーション
 */
async function fontLoad(fontToUpdate, stageUsingFont, loadingAnimation) {
    const urlFamilyName = fontToUpdate.familyName.replace(/ /g, "+");
    const googleFontApiUrl = `https://fonts.googleapis.com/css2?family=${urlFamilyName}`;

    loadingAnimation.start();
    const response = await fetch(googleFontApiUrl);
    if (response.ok) {
        const cssFontFace = await response.text();
        const matchUrls = cssFontFace.match(/url\(.+?\)/g);
        if (!matchUrls) {
            loadingAnimation.error();
            return;
        }
        for (const url of matchUrls) {
            const font = new FontFace(fontToUpdate.familyName, url);
            await font.load();
            document.fonts.add(font);
        }
        stageUsingFont.update();
        loadingAnimation.end();
    } else {
        loadingAnimation.error();
        return;
    }
}

/**
 * input[type="file"]にファイル変更時のイベント追加
 * @param {input要素} fileInput 
 * @param {更新するStage} stageToUpdate 
 */
function initFileInput(fileInput, stageToUpdate, fileErrorMessage) {
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length < 1) {
            stageToUpdate.setTmpBackgroud();
            return;
        }
        if (fileInput.files[0].type === "image/png") {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                fileErrorMessage.textContent = '';
                stageToUpdate.setBackgroundImage(fileReader.result);
            }
            fileReader.onerror = () => {
                fileErrorMessage.textContent = 'エラー：ファイルの読み込みに失敗しました。'
                stageToUpdate.tmpBackgroud();
            }
            fileReader.readAsDataURL(fileInput.files[0]);
        } else {
            fileErrorMessage.textContent = 'エラー：ファイルの読み込みに失敗しました。ファイル形式はpngのみ対応しています。'
            stageToUpdate.setTmpBackgroud();
        }
    })
}

/**
 * Inputにchangeイベントを追加
 * @param {Input} input イベントを追加するInput
 * @param {function} func 関数
 */
function inputInit(input, func) {
    input.addEventListener('change', func);
}

/**
 * Buttonにclickイベントを追加
 * @param {Button} button イベントを追加するButton
 * @param {function} func 関数
 */
function inputButtonInit(button, func) {
    button.addEventListener('click', func);
}

/**
 * エラーを表示する
 * @param {String} errorText 表示するテキスト
 */
function setErrorText(errorText) {
    document.querySelector('#errorMessage').innerHTML += `エラー：${errorText}<br/>`;
}

window.onload = init;