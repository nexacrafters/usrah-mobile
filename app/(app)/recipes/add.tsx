/**
 * Add Recipe Screen - Premium Design
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, Clock, Users, ChefHat, Plus, X, Sparkles, Flame, BookOpen } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import { ScreenHeader } from '../../../components/ui';
import { useCreateRecipe, useRecipeCategories } from '../../../hooks/queries/useRecipes';

const { width } = Dimensions.get('window');

const defaultCategories = [
  { id: 'breakfast', label: 'Breakfast', labelAr: 'فطور', emoji: '🌅' },
  { id: 'lunch', label: 'Lunch', labelAr: 'غداء', emoji: '🍲' },
  { id: 'dinner', label: 'Dinner', labelAr: 'عشاء', emoji: '🌙' },
  { id: 'dessert', label: 'Dessert', labelAr: 'حلويات', emoji: '🍰' },
  { id: 'snacks', label: 'Snacks', labelAr: 'وجبات خفيفة', emoji: '🥪' },
  { id: 'drinks', label: 'Drinks', labelAr: 'مشروبات', emoji: '🥤' },
];

const difficulties = [
  { id: 'easy', label: 'Easy', labelAr: 'سهل', color: Colors.success, emoji: '😊' },
  { id: 'medium', label: 'Medium', labelAr: 'متوسط', color: Colors.warning, emoji: '🤔' },
  { id: 'hard', label: 'Hard', labelAr: 'صعب', color: Colors.error, emoji: '💪' },
];

export default function AddRecipeScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const { family } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('lunch');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('4');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // API hooks
  const createRecipe = useCreateRecipe();
  const { data: apiCategories } = useRecipeCategories(family?.id || '');

  // Use API categories if available, otherwise fallback to defaults
  const categories = apiCategories?.length ? apiCategories.map(c => ({
    id: c.id,
    label: c.name,
    labelAr: c.name_ar || c.name,
    emoji: c.emoji || '🍴',
  })) : defaultCategories;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(rtl ? 'خطأ' : 'Error', rtl ? 'نحتاج إذن الوصول للصور' : 'We need photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(rtl ? 'خطأ' : 'Error', rtl ? 'يرجى إدخال اسم الوصفة' : 'Please enter recipe name');
      return;
    }

    if (!family?.id) {
      Alert.alert(rtl ? 'خطأ' : 'Error', rtl ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    const validIngredients = ingredients.filter(i => i.trim());

    try {
      await createRecipe.mutateAsync({
        family_id: family.id,
        title: name.trim(),
        description: description.trim() || undefined,
        category,
        difficulty,
        prep_time_minutes: parseInt(prepTime, 10) || undefined,
        cook_time_minutes: parseInt(cookTime, 10) || undefined,
        servings: parseInt(servings, 10) || 4,
        ingredients: validIngredients.length ? validIngredients : undefined,
        instructions: instructions.trim() || undefined,
        image_url: imageUri || undefined,
      });

      Alert.alert(
        rtl ? 'نجاح' : 'Success',
        rtl ? 'تم إضافة الوصفة بنجاح' : 'Recipe added successfully',
        [{ text: rtl ? 'حسناً' : 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'فشل في حفظ الوصفة' : 'Failed to save recipe'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={rtl ? 'إضافة وصفة' : 'Add Recipe'}
        showBack
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Upload */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <TouchableOpacity
            style={[styles.photoButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photoPreview} />
            ) : (
              <LinearGradient
                colors={[Colors.gold[100], Colors.gold[200]]}
                style={styles.photoPlaceholder}
              >
                <View style={styles.photoIconBox}>
                  <Camera size={28} color={Colors.gold[600]} />
                </View>
                <Text style={[styles.photoText, { color: Colors.gold[600], fontFamily: getFont('semibold') }]}>
                  {rtl ? 'إضافة صورة' : 'Add Photo'}
                </Text>
                <Text style={[styles.photoHint, { color: Colors.gold[500], fontFamily: getFont('regular') }]}>
                  {rtl ? 'اضغط لاختيار صورة' : 'Tap to select image'}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Recipe Name */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIconBox, { backgroundColor: Colors.gold[100] }]}>
              <ChefHat size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
              {rtl ? 'اسم الوصفة' : 'Recipe Name'} *
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={name}
            onChangeText={setName}
            placeholder={rtl ? 'مثال: كسكس تونسي' : 'e.g., Tunisian Couscous'}
            placeholderTextColor={theme.placeholder}
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIconBox, { backgroundColor: Colors.primary[100] }]}>
              <BookOpen size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
              {rtl ? 'الوصف' : 'Description'}
            </Text>
          </View>
          <TextInput
            style={[styles.textArea, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={description}
            onChangeText={setDescription}
            placeholder={rtl ? 'وصف قصير للوصفة...' : 'Brief description...'}
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Category */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.inputGroup}>
          <Text style={[styles.sectionLabel, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
            {rtl ? 'الفئة' : 'Category'}
          </Text>
          <View style={[styles.optionGrid, rtl && styles.rowReverse]}>
            {categories.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryButton, { borderColor: isSelected ? Colors.gold[500] : theme.cardBorder }]}
                  onPress={() => setCategory(cat.id)}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[Colors.gold[400], Colors.gold[600]]}
                      style={styles.categoryGradient}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.categoryTextActive, { fontFamily: getFont('medium') }]}>
                        {rtl ? cat.labelAr : cat.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.categoryInner, { backgroundColor: theme.card }]}>
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.categoryText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                        {rtl ? cat.labelAr : cat.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Difficulty */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIconBox, { backgroundColor: Colors.accent[100] }]}>
              <Flame size={18} color={Colors.accent[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
              {rtl ? 'الصعوبة' : 'Difficulty'}
            </Text>
          </View>
          <View style={[styles.difficultyRow, rtl && styles.rowReverse]}>
            {difficulties.map((diff) => {
              const isSelected = difficulty === diff.id;
              return (
                <TouchableOpacity
                  key={diff.id}
                  style={[styles.difficultyButton, { borderColor: isSelected ? diff.color : theme.cardBorder }]}
                  onPress={() => setDifficulty(diff.id as 'easy' | 'medium' | 'hard')}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[diff.color, diff.color]}
                      style={styles.difficultyGradient}
                    >
                      <Text style={styles.difficultyEmoji}>{diff.emoji}</Text>
                      <Text style={[styles.difficultyTextActive, { fontFamily: getFont('semibold') }]}>
                        {rtl ? diff.labelAr : diff.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.difficultyInner, { backgroundColor: theme.card }]}>
                      <Text style={styles.difficultyEmoji}>{diff.emoji}</Text>
                      <Text style={[styles.difficultyText, { color: theme.text, fontFamily: getFont('medium') }]}>
                        {rtl ? diff.labelAr : diff.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Time & Servings */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={[styles.timeRow, rtl && styles.rowReverse]}>
          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: theme.textSecondary, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
              {rtl ? 'تحضير' : 'Prep'}
            </Text>
            <View style={[styles.timeInput, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Clock size={16} color={Colors.primary[500]} />
              <TextInput
                style={[styles.timeValue, { color: theme.text, fontFamily: getFont('bold') }]}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="15"
                placeholderTextColor={theme.placeholder}
                keyboardType="number-pad"
              />
              <Text style={[styles.timeUnit, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {rtl ? 'د' : 'min'}
              </Text>
            </View>
          </View>

          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: theme.textSecondary, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
              {rtl ? 'طهي' : 'Cook'}
            </Text>
            <View style={[styles.timeInput, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <ChefHat size={16} color={Colors.gold[500]} />
              <TextInput
                style={[styles.timeValue, { color: theme.text, fontFamily: getFont('bold') }]}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="30"
                placeholderTextColor={theme.placeholder}
                keyboardType="number-pad"
              />
              <Text style={[styles.timeUnit, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {rtl ? 'د' : 'min'}
              </Text>
            </View>
          </View>

          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: theme.textSecondary, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
              {rtl ? 'حصص' : 'Servings'}
            </Text>
            <View style={[styles.timeInput, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Users size={16} color={Colors.sisters[500]} />
              <TextInput
                style={[styles.timeValue, { color: theme.text, fontFamily: getFont('bold') }]}
                value={servings}
                onChangeText={setServings}
                placeholder="4"
                placeholderTextColor={theme.placeholder}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </Animated.View>

        {/* Ingredients */}
        <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIconBox, { backgroundColor: Colors.success + '20' }]}>
              <Sparkles size={18} color={Colors.success} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
              {rtl ? 'المكونات' : 'Ingredients'}
            </Text>
          </View>
          {ingredients.map((ing, index) => (
            <View key={index} style={[styles.ingredientRow, rtl && styles.rowReverse]}>
              <View style={[styles.ingredientNumber, { backgroundColor: Colors.primary[100] }]}>
                <Text style={[styles.ingredientNumberText, { color: Colors.primary[600], fontFamily: getFont('bold') }]}>
                  {index + 1}
                </Text>
              </View>
              <TextInput
                style={[styles.ingredientInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                value={ing}
                onChangeText={(v) => updateIngredient(index, v)}
                placeholder={rtl ? `المكون ${index + 1}` : `Ingredient ${index + 1}`}
                placeholderTextColor={theme.placeholder}
                writingDirection={getWritingDirection()}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity style={[styles.removeButton, { backgroundColor: Colors.error + '15' }]} onPress={() => removeIngredient(index)}>
                  <X size={18} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={[styles.addIngredient, { borderColor: Colors.primary[500] }]} onPress={addIngredient}>
            <Plus size={18} color={Colors.primary[500]} />
            <Text style={[styles.addIngredientText, { color: Colors.primary[500], fontFamily: getFont('semibold') }]}>
              {rtl ? 'إضافة مكون' : 'Add Ingredient'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Instructions */}
        <Animated.View entering={FadeInUp.duration(400).delay(450)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIconBox, { backgroundColor: Colors.gold[100] }]}>
              <BookOpen size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
              {rtl ? 'طريقة التحضير' : 'Instructions'}
            </Text>
          </View>
          <TextInput
            style={[styles.instructionsArea, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder={rtl ? 'اكتب خطوات التحضير...' : 'Write the preparation steps...'}
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)}>
          <TouchableOpacity
            style={[styles.saveButton, createRecipe.isPending && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={createRecipe.isPending}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.gold[400], Colors.gold[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              {createRecipe.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <ChefHat size={22} color={Colors.white} />
                  <Text style={[styles.saveButtonText, { fontFamily: getFont('bold') }]}>
                    {rtl ? 'حفظ الوصفة' : 'Save Recipe'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },

  // Photo
  photoButton: {
    height: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 24,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  photoText: {
    fontSize: 16,
  },
  photoHint: {
    fontSize: 13,
  },

  // Input Groups
  inputGroup: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  inputIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 15,
    marginBottom: 12,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },

  // Category
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  categoryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
  },
  categoryTextActive: {
    fontSize: 13,
    color: Colors.white,
  },

  // Difficulty
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  difficultyGradient: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  difficultyInner: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  difficultyEmoji: {
    fontSize: 20,
  },
  difficultyText: {
    fontSize: 13,
  },
  difficultyTextActive: {
    fontSize: 13,
    color: Colors.white,
  },

  // Time Row
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  timeValue: {
    flex: 1,
    fontSize: 18,
    textAlign: 'center',
  },
  timeUnit: {
    fontSize: 13,
  },

  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  ingredientNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientNumberText: {
    fontSize: 12,
  },
  ingredientInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },
  addIngredientText: {
    fontSize: 14,
  },

  // Instructions
  instructionsArea: {
    minHeight: 160,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 24,
  },

  // Save Button
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 18,
    color: Colors.white,
  },
});
