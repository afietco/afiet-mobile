import { mealMeta, type MealType } from '@afiet/core'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { MealIcon } from '@/ui/appIcons'
import { IconChevronRight } from '@/ui/icons'
import { InlineErrorBoundary } from '@/ui/InlineErrorBoundary'
import { Sheet } from '@/ui/Sheet'
import { FirstLogCelebration } from '../../ftue/FirstLogCelebration'
import { AfiPhotoSheet } from '../AfiPhotoSheet'
import { AfiStepGuide } from './AfiStepGuide'
import { FoodDetailsStep } from './FoodDetailsStep'
import { FoodSearchStep } from './FoodSearchStep'
import { MealStep } from './MealStep'
import { useAddFoodFlow } from './useAddFoodFlow'

/**
 * The add-food wizard: one button, three deliberate steps, Afi alongside.
 *
 * The host owns the draft, the current step, Afi's stance and the single write
 * at the end; the steps own one decision each and nothing else. Moving on IS
 * the confirmation, so no step carries a confirm button or a checkbox. Only the
 * back arrow in the header returns, and only once the flow has actually walked
 * past the step it opened on.
 *
 * Props match the sheet this replaced so it drops into the same call sites.
 * Editing an existing entry is deliberately NOT handled here: an edit has no
 * decisions left to walk through, so it keeps its own single-form sheet.
 */

interface AddFoodFlowProps {
  profileId: number
  date: string
  open: boolean
  /** A preselected meal skips the first step; null starts at meal selection. */
  meal: MealType | null
  onClose: () => void
}

export function AddFoodFlow({ profileId, date, open, meal, onClose }: AddFoodFlowProps) {
  const flow = useAddFoodFlow({ profileId, date, open, meal, onClose })
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  const onMealStep = flow.step === 'meal'
  const heading =
    onMealStep || flow.meal === null
      ? 'Besin Ekle'
      : `${mealMeta(flow.meal).label} · Besin Ekle`

  /*
    The step used to slide in, and the slide is gone.

    An entering animation owns the view's FIRST frame: Reanimated commits the
    hidden state (opacity 0, translated) and only reveals it once the animation
    actually runs. When it does not run, the step is mounted and unreachable,
    which is exactly what people saw on a first launch: the sheet open on
    "Kahvaltı · Besin Ekle", Afi in the corner, and nothing underneath. The one
    thing wrapping everything that went missing was this animation, and the
    only things that survived were the ones outside it.

    This app has been here before. The tab scenes had a cross-fade removed for
    the same symptom (8058090, "mount edilmiş ama sıfır opaklıkta"), and the
    reasoning is the same: no piece of motion is worth a screen that cannot be
    used. The direction is still tracked, because the back arrow still needs to
    know whether it may go back.
  */
  return (
    <>
      <Sheet
        name="add_food_flow"
        open={open}
        onClose={flow.close}
        contentPanning={false}
        heightRatio={0.85}
        enablePanDownToClose={!flow.saving}
        title={
          <>
            {flow.canGoBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Önceki adıma dön"
                onPress={flow.back}
                className="-ml-1 h-11 w-11 items-center justify-center rounded-full active:bg-muted"
              >
                <View style={{ transform: [{ scaleX: -1 }] }}>
                  <IconChevronRight size={22} color={t.soft} />
                </View>
              </Pressable>
            ) : null}
            {!onMealStep && flow.meal !== null ? <MealIcon meal={flow.meal} size={22} /> : null}
            <AppText weight="bold" className="text-lg text-ink">
              {heading}
            </AppText>
          </>
        }
      >
        <AfiStepGuide cue={flow.cue} />

        {/* Keyed on the step so each one mounts fresh, and wrapped so a throw
            inside a step shows something recoverable instead of leaving this
            sheet open and blank. Sheets draw in the overlay layer, outside the
            route, so the route's own boundary never sees them. */}
        <InlineErrorBoundary label="Bu adımı yeniden dene">
          <View key={flow.step}>
          {flow.step === 'meal' ? (
            <MealStep
              draft={flow.draft}
              meal={flow.meal}
              onMeal={flow.chooseMeal}
              onDraft={flow.patchDraft}
              onAdvance={flow.advance}
              onCue={flow.setCue}
            />
          ) : null}

          {flow.step === 'search' ? (
            <FoodSearchStep
              profileId={profileId}
              meal={flow.meal}
              draft={flow.draft}
              onDraft={flow.patchDraft}
              onAdvance={flow.advance}
              onCue={flow.setCue}
              onNeedPhoto={flow.openPhoto}
              onAddSofra={flow.addSofra}
              onNeedBookmark={flow.openBookmark}
            />
          ) : null}

          {flow.step === 'details' && flow.meal !== null ? (
            <FoodDetailsStep
              meal={flow.meal}
              draft={flow.draft}
              saving={flow.saving}
              error={flow.error}
              onSave={flow.save}
              onDraft={flow.patchDraft}
              onAdvance={flow.advance}
              onCue={flow.setCue}
            />
          ) : null}
          </View>
        </InlineErrorBoundary>
      </Sheet>

      {/* The photo route writes its own entry and sits above the wizard. */}
      {flow.meal !== null ? (
        <AfiPhotoSheet
          open={flow.photoOpen}
          profileId={profileId}
          date={flow.entryDate}
          meal={flow.meal}
          hint={flow.draft.name.trim() || undefined}
          onClose={flow.closePhoto}
        />
      ) : null}

      {/* No define sheet here: the bookmark route stays inside the wizard, in
          the details step's Afi fill mode. */}

      {flow.celebrating !== null ? (
        <FirstLogCelebration foodName={flow.celebrating} onClose={flow.dismissCelebration} />
      ) : null}
    </>
  )
}
