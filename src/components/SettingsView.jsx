import { useEffect, useRef, useState } from 'react'
import {
  buildBackup,
  describeSaveError,
  downloadBackup,
  downloadCsv,
  parseBackup,
} from '../lib/backup'
import {
  describeFolderError,
  forgetFolder,
  getRememberedFolder,
  isFolderSaveSupported,
  pickFolder,
  saveToFolder,
} from '../lib/folderSave'
import { AUTO_SAVE_FILENAME } from '../hooks/useFolderAutoSave'
import AskModal from './AskModal'
import AppImage from './AppImage'
import TinyChara from './TinyChara'
import Icon from './Icon'
import InstallCard from './InstallCard'
import { isStorageAvailable } from '../lib/storage'
import { sumCost } from '../lib/treatments'
import {
  getPermission,
  isNotificationSupported,
  requestPermission,
} from '../hooks/useReminder'

function Card({ title, children, tone = 'bg-paper' }) {
  return (
    <div className={`ink-line blob-a sticker-shadow px-4 py-3 ${tone}`}>
      <p className="mb-2 text-[11px] font-black text-ink-soft">{title}</p>
      {children}
    </div>
  )
}

function ActionButton({ onClick, children, tone = 'bg-warm-yellow', icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ink-line blob-b sticker-shadow flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-black transition active:translate-x-[2px] active:translate-y-[3px] active:shadow-none ${tone}`}
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  )
}

/* ── バックアップ ───────────────────────────────────────── */

function BackupCard({ records, treatments, settings, onRestore }) {
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState(null)
  // 読みこみは全部を置きかえる操作なので、必ず一度たしかめる
  const [pendingRestore, setPendingRestore] = useState(null)

  const recordCount = Object.keys(records).length

  const handleExport = async () => {
    const result = await downloadBackup(records, treatments, settings)
    setMessage(
      result.ok
        ? { tone: 'ok', text: `${result.recordCount}日ぶんを書き出しました。` }
        : { tone: 'ng', text: describeSaveError(result.code) },
    )
  }

  const handleCsv = async () => {
    const result = await downloadCsv(records)
    setMessage(
      result.ok
        ? { tone: 'ok', text: `${result.rowCount}日ぶんをCSVで書き出しました。` }
        : { tone: 'ng', text: describeSaveError(result.code) },
    )
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // 同じファイルをもう一度選べるように
    if (!file) return

    const text = await file.text()
    const result = parseBackup(text)

    if (!result.ok) {
      setMessage({ tone: 'ng', text: result.error })
      return
    }

    setPendingRestore(result)
  }

  const confirmRestore = () => {
    onRestore(pendingRestore)
    setMessage({ tone: 'ok', text: `${pendingRestore.recordCount}日ぶんを読みこみました。` })
    setPendingRestore(null)
  }

  return (
    <Card title="バックアップ">
      <p className="mb-2 text-[11px] font-bold text-ink-soft">
        記録はこの端末の中だけにあります。ブラウザの履歴を消すと
        <strong className="text-cheek-deep">いっしょに消えます</strong>
        。ときどき書き出して保存してください。
      </p>

      <div className="flex flex-col gap-2">
        <ActionButton onClick={handleExport} icon="download">
          書き出す（{recordCount}日ぶん）
        </ActionButton>
        <ActionButton onClick={() => fileInputRef.current?.click()} icon="upload">
          ファイルから もどす
        </ActionButton>
        <ActionButton onClick={handleCsv} tone="bg-hachi" icon="table">
          CSVで書き出す（Excel用）
        </ActionButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
      />

      {message && (
        <p
          className={`mt-2 text-center text-[11px] font-black ${
            message.tone === 'ok' ? 'text-grass-deep' : 'text-cheek-deep'
          }`}
        >
          {message.text}
        </p>
      )}

      {pendingRestore && (
        <AskModal
          title={'ぜんぶ 置きかえる？'}
          body={`いまの記録 ${recordCount}日ぶんを、ファイルの ${pendingRestore.recordCount}日ぶんで 置きかえます。もとには もどせません。`}
          okLabel="置きかえる"
          cancelLabel="やめる"
          onOk={confirmRestore}
          onCancel={() => setPendingRestore(null)}
        />
      )}
    </Card>
  )
}

/* ── 保存先フォルダ（ドライブへの直接保存） ─────────────── */

function FolderCard({ records, treatments, settings, onUpdate, autoSaveStatus }) {
  const [folder, setFolder] = useState(null)
  const [message, setMessage] = useState(null)

  const supported = isFolderSaveSupported()

  useEffect(() => {
    if (!supported) return
    getRememberedFolder().then(setFolder)
  }, [supported])

  const handlePick = async () => {
    const result = await pickFolder()
    if (result.ok) {
      setFolder({ name: result.name, granted: true })
      setMessage({ tone: 'ok', text: `「${result.name}」に 保存します。` })
    } else if (result.code !== 'cancelled') {
      setMessage({ tone: 'ng', text: describeFolderError(result.code) })
    }
  }

  const handleSaveNow = async () => {
    const payload = JSON.stringify(buildBackup(records, treatments, settings), null, 2)
    const result = await saveToFolder(AUTO_SAVE_FILENAME, payload)
    setMessage(
      result.ok
        ? { tone: 'ok', text: `「${result.name}」に 保存しました。` }
        : { tone: 'ng', text: describeFolderError(result.code) },
    )
  }

  const handleForget = async () => {
    await forgetFolder()
    setFolder(null)
    onUpdate({ folderAutoSave: false })
    setMessage({ tone: 'ok', text: '保存先を わすれました。' })
  }

  if (!supported) {
    return (
      <Card title="ドライブに保存">
        <p className="text-[11px] leading-relaxed font-bold text-ink-soft">
          このブラウザでは フォルダへの直接保存が使えません。
          <br />
          パソコンの Chrome か Edge で開くと使えます。
        </p>
      </Card>
    )
  }

  return (
    <Card title="ドライブに保存">
      <p className="mb-2 text-[11px] leading-relaxed font-bold text-ink-soft">
        パソコンに同期されている
        <strong className="text-cheek-deep">Googleドライブ（や OneDrive）のフォルダ</strong>
        をえらぶと、そこへ控えを書き出します。あとは同期ソフトが クラウドへ上げてくれます。
      </p>

      {folder ? (
        <div className="ink-line blob-b mb-2 flex items-center gap-2 bg-warm-yellow px-3 py-2">
          <Icon name="folder" size={18} />
          <span className="min-w-0 flex-1 truncate text-xs font-black">{folder.name}</span>
          <button
            type="button"
            onClick={handleForget}
            className="shrink-0 text-[10px] font-black text-ink-soft underline"
          >
            変える
          </button>
        </div>
      ) : (
        <p className="mb-2 text-[11px] font-black text-ink-soft">保存先は まだ えらんでいません</p>
      )}

      <div className="flex flex-col gap-2">
        <ActionButton onClick={handlePick} tone="bg-usagi" icon="folder">
          {folder ? '保存先を えらびなおす' : '保存先の フォルダを えらぶ'}
        </ActionButton>

        {folder && (
          <ActionButton onClick={handleSaveNow} icon="download">
            いま フォルダに保存する
          </ActionButton>
        )}
      </div>

      {folder && (
        <label className="mt-2 flex items-start gap-2">
          <input
            type="checkbox"
            checked={settings.folderAutoSave}
            onChange={(e) => onUpdate({ folderAutoSave: e.target.checked })}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-cheek-deep)]"
          />
          <span className="text-[11px] leading-relaxed font-bold">
            記録するたび、自動で保存する
            <span className="block text-[10px] text-ink-soft">
              {AUTO_SAVE_FILENAME} を上書きします
            </span>
          </span>
        </label>
      )}

      {/*
        自動保存はダイアログを出さずに書くので、許可が切れていると
        黙って失敗する。控えが残っていないのに残っているつもりでいるのが
        いちばん危ないので、失敗したことをはっきり出す。
      */}
      {settings.folderAutoSave && autoSaveStatus === 'error' && (
        <p className="ink-line blob-b mt-2 bg-cheek px-3 py-2 text-[11px] leading-relaxed font-black">
          じどう保存が できていません。
          <br />
          下の「いま フォルダに保存する」を 一度おして、許可しなおしてください。
        </p>
      )}

      {settings.folderAutoSave && autoSaveStatus === 'saved' && (
        <p className="mt-2 text-center text-[10px] font-black text-grass-deep">
          じどう保存 しました
        </p>
      )}

      {folder && folder.granted === false && (
        <p className="mt-2 text-[10px] font-black text-cheek-deep">
          ブラウザを開き直したので、次に保存するとき 許可を もう一度ききます。
        </p>
      )}

      {message?.text && (
        <p
          className={`mt-2 text-center text-[11px] font-black ${
            message.tone === 'ok' ? 'text-grass-deep' : 'text-cheek-deep'
          }`}
        >
          {message.text}
        </p>
      )}
    </Card>
  )
}

/* ── リマインダー ───────────────────────────────────────── */

function ReminderCard({ settings, onUpdate }) {
  const [permission, setPermission] = useState(getPermission)

  const supported = isNotificationSupported()

  const handleToggle = async () => {
    if (settings.reminderEnabled) {
      onUpdate({ reminderEnabled: false })
      return
    }

    let current = getPermission()
    if (current === 'default') {
      current = await requestPermission()
      setPermission(current)
    }

    if (current === 'granted') {
      onUpdate({ reminderEnabled: true })
    }
  }

  return (
    <Card title="毎朝のおしらせ">
      {!supported ? (
        <p className="text-[11px] font-bold text-ink-soft">
          この端末では通知が使えないようです。
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={settings.reminderEnabled}
              onClick={handleToggle}
              className={`ink-line blob-pill sticker-shadow px-4 py-2 text-sm font-black transition active:translate-x-[2px] active:translate-y-[3px] active:shadow-none ${
                settings.reminderEnabled ? 'bg-cheek' : 'bg-paper text-ink-soft'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Icon name={settings.reminderEnabled ? 'bell' : 'bellOff'} size={17} />
                {settings.reminderEnabled ? 'おしらせ する' : 'おしらせ しない'}
              </span>
            </button>

            <label className="flex items-center gap-1">
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => onUpdate({ reminderTime: e.target.value })}
                className="ink-line blob-b bg-warm-yellow px-2 py-1.5 text-sm font-black outline-none"
              />
            </label>
          </div>

          {permission === 'denied' && (
            <p className="mt-2 text-[11px] font-black text-cheek-deep">
              通知が ブロックされています。ブラウザの設定から許可してください。
            </p>
          )}

          <p className="mt-2 text-[10px] font-bold text-ink-soft">
            アプリを開いている間だけ鳴ります。ホーム画面に追加しておくと鳴りやすくなります。
            その日もう記録していれば鳴りません。
          </p>
        </>
      )}
    </Card>
  )
}

/* ── 本体 ───────────────────────────────────────────────── */

function SettingsView({
  records,
  treatments,
  settings,
  onUpdateSettings,
  onRestore,
  onPrint,
  onCustomize,
  autoSaveStatus,
  image,
}) {
  const totalCost = sumCost(treatments)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-5">
      <h1 className="flex items-center justify-center gap-1.5 font-hand text-xl font-bold">
        <AppImage
          src={image}
          size={30}
          className="animate-fuwa"
          fallback={<TinyChara pose="smile" size={28} className="animate-fuwa" />}
        />
        設定
      </h1>

      <BackupCard
        records={records}
        treatments={treatments}
        settings={settings}
        onRestore={onRestore}
      />

      <FolderCard
        records={records}
        treatments={treatments}
        settings={settings}
        onUpdate={onUpdateSettings}
        autoSaveStatus={autoSaveStatus}
      />

      {/* 開発用の道具。できあがったアプリには出さない */}
      {import.meta.env.DEV && (
        <Card title="絵と ことば（開発用）">
          <p className="mb-2 text-[11px] leading-relaxed font-bold text-ink-soft">
            アプリに出てくる絵と ことばを決めて、アプリ本体に焼きこみます。
          </p>
          <ActionButton onClick={onCustomize} tone="bg-usagi" icon="pencil">
            絵と ことばを えらぶ
          </ActionButton>
        </Card>
      )}

      <Card title="病院に持っていく">
        <p className="mb-2 text-[11px] font-bold text-ink-soft">
          グラフと記録を、紙に印刷できる形で出します。PDFとして保存もできます。
        </p>
        <ActionButton onClick={onPrint} tone="bg-cheek" icon="printer">
          印刷用の表を ひらく
        </ActionButton>
      </Card>

      <Card title="画面の明るさ">
        <p className="mb-2 text-[11px] leading-relaxed font-bold text-ink-soft">
          朝いちばんの暗い部屋で まぶしくないように、
          <strong className="text-cheek-deep">暗い画面</strong>
          にできます。
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'auto', label: '端末に\nあわせる' },
            { id: 'light', label: 'あかるい' },
            { id: 'dark', label: 'くらい' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={settings.theme === item.id}
              onClick={() => onUpdateSettings({ theme: item.id })}
              className={`ink-line blob-pill py-2 text-[11px] leading-tight font-black whitespace-pre-line transition ${
                settings.theme === item.id
                  ? 'bg-cheek sticker-shadow'
                  : 'bg-paper text-ink-soft'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <InstallCard />

      <ReminderCard settings={settings} onUpdate={onUpdateSettings} />

      {totalCost > 0 && (
        <Card title="かかったお金（ぜんぶ）" tone="bg-usagi">
          <p className="text-center leading-none font-black">
            <span className="text-3xl tabular-nums">{totalCost.toLocaleString()}</span>
            <span className="pl-1 text-sm">円</span>
          </p>
          <p className="mt-1 text-center text-[10px] font-bold text-ink-soft">
            医療費控除や助成金の申請にどうぞ
          </p>
        </Card>
      )}

      {!isStorageAvailable() && (
        <Card title="保存の状態" tone="bg-cheek">
          <p className="text-[11px] leading-relaxed font-black">
            このブラウザでは 記録を保存できません。
            <br />
            いま入れた記録は、アプリを閉じると 消えます。
          </p>
          <p className="mt-1.5 text-[10px] leading-relaxed font-bold">
            プライベートモードを やめるか、ふつうのウィンドウで開いてください。
            <br />
            いまの記録を残したい場合は、先に「書き出す」でファイルに保存してください。
          </p>
        </Card>
      )}

      <Card title="このアプリについて">
        <p className="text-[11px] leading-relaxed font-bold text-ink-soft">
          <strong className="text-cheek-deep">アプリ自体は どこにも通信しません。</strong>
          記録はこの端末の中だけにあります。
          <br />
          ただし「ドライブに保存」で
          <em className="not-italic">同期フォルダ</em>
          をえらんだ場合は、書き出したファイルを 同期ソフトが クラウドへ上げます。
          <br />
          <br />
          周期や排卵日の表示は、これまでの記録の平均から出した
          <strong className="text-cheek-deep">目安</strong>
          です。治療中は 医師の指示が優先されます。
        </p>
      </Card>
    </div>
  )
}

export default SettingsView
