import { useEffect, useRef, useState } from 'react'
import CalendarView from './components/CalendarView'
import CertificationView from './components/CertificationView'
import ChartView from './components/ChartView'
import CheerModal from './components/CheerModal'
import DayEditor from './components/DayEditor'
import PhoneFrame from './components/PhoneFrame'
import PrintSheet from './components/PrintSheet'
import QuickEntry from './components/QuickEntry'
import RecordView from './components/RecordView'
import SettingsView from './components/SettingsView'
import ShareSheet from './components/ShareSheet'
import StorageWarning from './components/StorageWarning'
import TabBar from './components/TabBar'
import { pickCheerSet, pickGroup } from './lib/cheer'
import CustomizeView from './components/CustomizeView'
import { useCustomAssets } from './hooks/useCustomAssets'
import MiniCheer from './components/MiniCheer'
import { recordCheerKind, treatmentCheerKind } from './data/miniCheers'
import { useFolderAutoSave } from './hooks/useFolderAutoSave'
import { useMiniCheer } from './hooks/useMiniCheer'
import { useRecords } from './hooks/useRecords'
import { useReminder } from './hooks/useReminder'
import { useSettings } from './hooks/useSettings'
import { useStorageHealth } from './hooks/useStorageHealth'
import { useTreatments } from './hooks/useTreatments'
import { findNewlyUnlocked } from './lib/certification'
import { calcBestStreak, calcStreak, formatLong, shiftKey, todayKey } from './lib/dateUtils'
import AskModal from './components/AskModal'
import { normalizeRecord, nowTime, withTemperature } from './lib/records'
import { findSuspiciousJump } from './lib/temperature'
import { getSubjugations, getSubjugationKinds } from './lib/subjugation'
import { normalizeTreatment } from './lib/treatments'

const DEFAULT_TEMPERATURE = 36.5

/**
 * 起点になる体温。
 * 前回の値から少し動かすだけで済むよう、直近の記録を初期値にする。
 * 寝ぼけていても操作が少なくて済むように。
 */
function getInitialTemperature(records) {
  const today = records[todayKey()]
  if (today?.temperature != null) return today.temperature

  const keys = Object.keys(withTemperature(records)).sort()
  if (keys.length > 0) return records[keys[keys.length - 1]].temperature

  return DEFAULT_TEMPERATURE
}

function App() {
  const { records, updateRecord, replaceAll: replaceRecords } = useRecords()
  const { treatments, updateTreatment, replaceAll: replaceTreatments } = useTreatments()
  const { settings, updateSettings } = useSettings()
  const assets = useCustomAssets()
  const miniCheer = useMiniCheer()
  const storageOk = useStorageHealth()

  /*
   * カレンダーやまとめて入力から記録したときも、小さく反応を出す。
   * 「きろく する！」ボタンだけ大きなお祝いが出て、
   * ほかは無反応だと、つけた実感がないため。
   */
  const patchRecord = (dateKey, patch) => {
    miniCheer.show(recordCheerKind(patch, records[dateKey]))

    /*
     * カレンダーやまとめて入力で連続日数が伸びて級が上がったときも、
     * ちゃんとお祝いする。記録ボタンから入れたときだけ賞状が出て、
     * こちらから入れたら出ないのは おかしいため。
     */
    if (typeof patch.temperature === 'number') {
      const nextRecords = {
        ...records,
        [dateKey]: normalizeRecord({ ...records[dateKey], ...patch }),
      }
      // 級は「のべ日数」で上がる
      const before = Object.keys(withTemperature(records)).length
      const after = Object.keys(withTemperature(nextRecords)).length
      const unlocked = findNewlyUnlocked(before, after)
      if (unlocked) {
        const set = pickCheerSet(
          assets.cheerSets,
          pickGroup(calcStreak(records), calcStreak(nextRecords)),
          lastMessageRef.current,
        )
        lastMessageRef.current = set.text
        setCelebration({ message: set.text, image: set.image, certification: unlocked })
      }
    }

    updateRecord(dateKey, patch)
  }

  const patchTreatment = (dateKey, patch) => {
    miniCheer.show(treatmentCheerKind(patch, treatments[dateKey]))
    updateTreatment(dateKey, patch)
  }

  const [activeTab, setActiveTab] = useState('record')
  const [editingDay, setEditingDay] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isQuickEntry, setIsQuickEntry] = useState(false)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [sharing, setSharing] = useState(null)
  // 「きろく」画面がいまどの日をつけているか。ふだんは今日
  const [targetKey, setTargetKey] = useState(todayKey)
  const [temperature, setTemperature] = useState(() => getInitialTemperature(records))
  const [selectedTagIds, setSelectedTagIds] = useState(() => records[todayKey()]?.tags ?? [])
  const [celebration, setCelebration] = useState(null)
  const [askJump, setAskJump] = useState(null)
  // 測った時刻。今日ならいまの時刻を入れておく
  const [time, setTime] = useState(() => records[todayKey()]?.time ?? nowTime())
  const [isBumping, setIsBumping] = useState(false)

  const bumpTimerRef = useRef(null)
  const lastMessageRef = useRef(null)

  useEffect(() => () => clearTimeout(bumpTimerRef.current), [])

  const todayK = todayKey()
  const streak = calcStreak(records)
  const alreadyRecorded = records[targetKey]?.temperature != null
  const yesterdayMissing = records[shiftKey(todayK, -1)]?.temperature == null

  /** つける日を変えたら、その日の内容を画面に読み込み直す */
  const changeTargetKey = (key) => {
    setTargetKey(key)
    setTemperature(records[key]?.temperature ?? getInitialTemperature(records))
    setSelectedTagIds(records[key]?.tags ?? [])
    // 過ぎた日は、いまの時刻を入れても意味がないので空にする
    setTime(records[key]?.time ?? (key === todayKey() ? nowTime() : null))
  }

  useReminder({
    enabled: settings.reminderEnabled,
    time: settings.reminderTime,
    alreadyRecordedToday: alreadyRecorded,
  })

  // 同期フォルダ（Googleドライブなど）へ、記録のたびに控えを書き出す
  const autoSaveStatus = useFolderAutoSave({
    enabled: settings.folderAutoSave,
    records,
    treatments,
    settings,
  })

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  /** 打ちまちがいらしき値なら、一度だけ確認してから保存する */
  const handleRecord = () => {
    const jump = findSuspiciousJump(records, targetKey, temperature)
    if (jump) {
      setAskJump(jump)
      return
    }
    saveRecord()
  }

  const saveRecord = () => {
    setAskJump(null)
    const previousStreak = calcStreak(records)
    const previousTotal = Object.keys(withTemperature(records)).length

    updateRecord(targetKey, { temperature, tags: selectedTagIds, time })

    // 保存後の連続日数を、同じ計算で先に求めておく
    const nextRecords = {
      ...records,
      [targetKey]: normalizeRecord({
        ...records[targetKey],
        temperature,
        tags: selectedTagIds,
        time,
      }),
    }
    const nextStreak = calcStreak(nextRecords)
    const nextTotal = Object.keys(withTemperature(nextRecords)).length

    setIsBumping(true)
    clearTimeout(bumpTimerRef.current)
    bumpTimerRef.current = setTimeout(() => setIsBumping(false), 700)

    const set = pickCheerSet(
      assets.cheerSets,
      pickGroup(previousStreak, nextStreak),
      lastMessageRef.current,
    )
    lastMessageRef.current = set.text

    setCelebration({
      message: set.text,
      image: set.image,
      certification: findNewlyUnlocked(previousTotal, nextTotal),
      subjugation: getSubjugationKinds(nextRecords, treatments, targetKey),
    })
  }

  const handleRestore = (backup) => {
    replaceRecords(backup.records)
    replaceTreatments(backup.treatments)
    if (backup.settings) updateSettings(backup.settings)
    setTemperature(getInitialTemperature(backup.records))
  }

  return (
    <PhoneFrame>
      {/* 保存できていないときだけ、どの画面でも上に出る */}
      {!storageOk && <StorageWarning />}

      <main className="flex flex-1 flex-col overflow-y-auto">
        {activeTab === 'record' && (
          <RecordView
            temperature={temperature}
            onTemperatureChange={setTemperature}
            selectedTagIds={selectedTagIds}
            onToggleTag={toggleTag}
            onRecord={handleRecord}
            isBumping={isBumping}
            alreadyRecorded={alreadyRecorded}
            streak={streak}
            targetKey={targetKey}
            onTargetKeyChange={changeTargetKey}
            yesterdayMissing={yesterdayMissing}
            onShare={() => setSharing({ dateKey: targetKey, message: lastMessageRef.current })}
            image={assets.decorations.record}
            time={time}
            onTimeChange={setTime}
            onGoToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            records={records}
            treatments={treatments}
            onSelectDay={setEditingDay}
            onQuickEntry={() => setIsQuickEntry(true)}
            image={assets.decorations.calendar}
          />
        )}

        {activeTab === 'chart' && (
          <ChartView
            records={records}
            treatments={treatments}
            image={assets.decorations.empty}
            headerImage={assets.decorations.chart}
          />
        )}

        {activeTab === 'badge' && (
          <CertificationView
            streak={streak}
            totalDays={Object.keys(withTemperature(records)).length}
            bestStreak={calcBestStreak(records)}
            image={assets.decorations.badge}
            subjugation={getSubjugations(records, treatments)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            records={records}
            treatments={treatments}
            settings={settings}
            onUpdateSettings={updateSettings}
            onRestore={handleRestore}
            onPrint={() => setIsPrinting(true)}
            onCustomize={() => setIsCustomizing(true)}
            autoSaveStatus={autoSaveStatus}
            image={assets.decorations.settings}
          />
        )}
      </main>

      <TabBar activeId={activeTab} onChange={setActiveTab} />

      <MiniCheer cheer={miniCheer.cheer} />

      {editingDay && (
        <DayEditor
          dateKey={editingDay}
          record={records[editingDay] ?? normalizeRecord(null)}
          treatment={treatments[editingDay] ?? normalizeTreatment(null)}
          onPatchRecord={(patch) => patchRecord(editingDay, patch)}
          onPatchTreatment={(patch) => patchTreatment(editingDay, patch)}
          onClose={() => setEditingDay(null)}
        />
      )}

      {isQuickEntry && (
        <QuickEntry
          records={records}
          onPatchRecord={patchRecord}
          onClose={() => setIsQuickEntry(false)}
        />
      )}

      {/*
        import.meta.env.DEV は本番ビルドで false に置きかわるので、
        編集画面のコードごと まるごと取り除かれる。
        （assets.isEditable のような実行時の判定だと、
         画面に出ないだけでコードは残ってしまう）
      */}
      {import.meta.env.DEV && isCustomizing && (
        <CustomizeView
          decorations={assets.decorations}
          cheerSets={assets.cheerSets}
          onPickDecoration={assets.setDecoration}
          onClearDecoration={assets.clearDecoration}
          onChangeCheerSets={assets.updateCheerSets}
          onResetCheerSets={assets.resetCheerSets}
          onBake={assets.bake}
          onClose={() => setIsCustomizing(false)}
        />
      )}

      {isPrinting && (
        <PrintSheet
          records={records}
          treatments={treatments}
          onClose={() => setIsPrinting(false)}
        />
      )}

      {askJump && (
        <AskModal
          title={`${temperature.toFixed(2)}℃ で いい？`}
          body={`まえの記録（${formatLong(askJump.previousKey)}）は ${askJump.previous.toFixed(2)}℃ でした。${askJump.gap.toFixed(2)}℃ ちがいます。`}
          okLabel="これで あってる"
          cancelLabel="なおす"
          onOk={saveRecord}
          onCancel={() => setAskJump(null)}
        />
      )}

      {celebration && (
        <CheerModal
          message={celebration.message}
          image={celebration.image}
          certification={celebration.certification}
          subjugation={celebration.subjugation}
          onClose={() => setCelebration(null)}
          onShare={() => {
            setSharing({ dateKey: targetKey, message: celebration.message })
            setCelebration(null)
          }}
        />
      )}

      {sharing && (
        <ShareSheet
          records={records}
          dateKey={sharing.dateKey}
          cheerMessage={sharing.message}
          onClose={() => setSharing(null)}
        />
      )}
    </PhoneFrame>
  )
}

export default App
