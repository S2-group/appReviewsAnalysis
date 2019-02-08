# -*- coding: utf-8 -*-
"""
Spyder Editor

This is a temporary script file.
"""
# <codecell>
import pandas as pd
import numpy as np
import os
os.chdir('/Users/gianlucascoccia/Desktop/reviews_code_new') 
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn import tree
from sklearn.model_selection import RepeatedKFold
from sklearn.model_selection import cross_validate
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.decomposition import TruncatedSVD
from nltk.stem.snowball import EnglishStemmer
from sklearn.exceptions import UndefinedMetricWarning
from array_caster import ArrayCaster
from item_selector import ItemSelector
from nltk import word_tokenize          
from nltk.stem import WordNetLemmatizer 

TRAIN_SIZE = 0.95
N_SPLITS = 10
N_REPEATS = 25
 

# <codecell>

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UndefinedMetricWarning)

# <codecell>
labeled = pd.read_csv('./Reviews_manually_classified.tsv', sep='\t')
unlabeled = pd.read_csv('./Reviews_for_automatic_classification.tsv', sep='\t', names=['ID','Date','Review score','Review text','Sentiment'])
#all_ = pd.read_excel('Twitter-hate_speech-all_data.xlsx')

# <codecell>
bayes_clf =  MultinomialNB()
svm_clf = SVC()
maxent_clf = LogisticRegression()
forest_clf = RandomForestClassifier()
dtree_clf = tree.DecisionTreeClassifier()
ch2 = SelectKBest(chi2, k=150)
svd = TruncatedSVD(n_components=20, n_iter=7, random_state=42)

scoring = {'f1': 'f1_macro',
           'precision': 'precision_macro',
           'recall': 'recall_macro'}

# <codecell>

stemmer = EnglishStemmer()
lemmer = WordNetLemmatizer()
analyzer = CountVectorizer().build_analyzer()

# Stemmer helper
def stem_words(doc):
    return (stemmer.stem(w) for w in analyzer(doc))

# Lemmer helper
class LemmaTokenizer(object):
    def __init__(self):
        self.wnl = WordNetLemmatizer()
    def __call__(self, articles):
        return [self.wnl.lemmatize(t) for t in word_tokenize(articles)]

tfidf = TfidfVectorizer(tokenizer=LemmaTokenizer(), # comment to remove lemmatization
                        ngram_range = (1,2),
                        strip_accents = 'unicode',
                        stop_words = 'english',
                        #analyzer = stem_words, # comment to remove stemming
                        sublinear_tf = True)

# <codecell>


print("{:^7}{:^15}{:^5}{:^9}{:^9}{:^9}{:^9}".format('Label','Class','Count','F1','Prec','Rec','TestAcc'))
print("-------------------------------------------------------------------")
for label in ['PP', 'PC', 'MiP', 'TMP', 'UP', 'PRB', 'FU', 'SP', 'BT', 'AWP']:
    has_label = labeled[labeled['Label'].str.contains(label)]
    not_has_label = labeled[np.logical_not(labeled['Label'].str.contains(label))]
    has_label.is_copy, has_label['Label'] = False, 'Positive'
    not_has_label.is_copy, not_has_label['Label'] = False, 'Negative'
    balanced = pd.concat([has_label, not_has_label.sample(len(has_label), replace = False)])
    balanced_train, balanced_test = train_test_split(balanced, train_size=TRAIN_SIZE)
 
    for classif in [('naive_bayes', bayes_clf), ('svm', svm_clf), ('max_ent', maxent_clf), ('random_forest', forest_clf)]:
        
        
        p1 = Pipeline([
                ('selector', ItemSelector(key='Review score')),
                ('caster', ArrayCaster())
                ])
    
        p2 = Pipeline([ 
                ('selector', ItemSelector(key='Review text')),
                ('tfidf', tfidf)
                ])
                    
        
        p = Pipeline([
                ('features', FeatureUnion([
                        ('meta', p1),
                        ('body', p2)])
                ),
                ('class', classif[1])
                ])
    
        p.fit(balanced_train, balanced_train["Label"])
    
    
        scores = cross_validate(p, 
                             balanced_train, 
                             balanced_train["Label"], 
                             scoring=scoring, 
                             cv=RepeatedKFold(n_splits=N_SPLITS, n_repeats=N_REPEATS))
    
        
        print("{:^7}{:^15}{:^5}".format(label, classif[0], len(has_label)), end='')
        for metric in scores.keys():
            if 'test_' in metric:
                # f1, precision, recall
                print("{:^9}".format(np.mean(scores[metric]).round(5)), end='')
    
        test_score = p.score(balanced_test, balanced_test["Label"])
        #print("Accuracy on test portion of data: {}".format(test_score))    
        print('{:^9}'.format(test_score.round(5)))    