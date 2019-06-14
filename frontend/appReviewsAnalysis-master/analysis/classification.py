# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
import csv
import os
import warnings
from argparse import ArgumentParser
from pluginbase import PluginBase
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn import tree
from sklearn.model_selection import RepeatedKFold
from sklearn.model_selection import cross_validate
from nltk.stem.snowball import EnglishStemmer
from sklearn.exceptions import UndefinedMetricWarning, ConvergenceWarning
from sklearn.neighbors import KNeighborsClassifier
from array_caster import ArrayCaster
from item_selector import ItemSelector
from nltk import word_tokenize, sys
from nltk.stem import WordNetLemmatizer
from collections import Counter
from os import remove
from io import StringIO
from pathlib import Path

"""
TERMINAL CALL EXAMPLES
-With labels: python classification.py -labeled_data ./Reviews_manually_classified -unlabeled_data ./Reviews_for_automatic_classification -labels PP,PC,MiP,TMP,UP,PRB,FU,SP,BT,AWP -classifiers 1,0,0,0,0,1,0 -pre 1,1,1 -param 0.8,5,25 -extraction 1 -knn 6
-Fast (without preprocessing): python classification.py -labeled_data ./Reviews_manually_classified -unlabeled_data ./Reviews_for_automatic_classification -labels PP,PC,MiP,TMP,UP,PRB,FU,SP,BT,AWP -classifiers 1,0,0,0,0,1,0 -pre 0,0,0 -param 0.8,5,25 -extraction 0 -knn 6
-Without labels: python classification.py -labeled_data ./Reviews_manually_classified -unlabeled_data ./Reviews_for_automatic_classification -classifiers 0,1,0,0,1,0,1 -pre 1,1,1 -param 0.8,5,25 -extraction 1
-Plugin: python classification.py -labeled_data ./Reviews_manually_classified -unlabeled_data ./Reviews_for_automatic_classification -classifiers 0,0,0,0,0,0,0 -pre 0,0,0 -param 0.8,5,25 -extraction 0 -plugins_path ./plugins -plugins my_plugin,my_plugin_2
-Only comparison (no unlabeled data): python classification.py -labeled_data ./Reviews_manually_classified -labels PP,PC,MiP,TMP,UP,PRB,FU,SP,BT,AWP -classifiers 0,0,0,0,1,1,0 -pre 1,1 -param 0.8,5,25
"""

# ------------------------------------INPUT---------------------------------------------------------

# Arguments parser + quantity and format checks
def arguments():
    global NAIVE, MAXENT, FOREST, SVM, KNN, TREE, MLP
    global STOP, STEAM, LEMMA, TRAIN_SIZE, NGRAMS
    global N_SPLITS, N_REPEATS, KNN_N
    global labeled, unlabeled, labels, MODE, RATINGS
    global plugins_use, plugins_path, plugin_names

    # Default values for the unrequired parameters in case of missing
    NAIVE, MAXENT, FOREST, SVM, KNN, TREE, MLP = 0, 0, 0, 0, 0, 0, 0
    STOP, STEAM, LEMMA = 1, 1, 1
    NGRAMS = 1
    TRAIN_SIZE = 0.8
    N_SPLITS = 5
    N_REPEATS = 10
    KNN_N = 5
    MODE = 0  # Labeling (1) or just comparing (0)
    RATINGS = 1  # App reviews ratings are used by the classifier
    plugins_use, plugins_path = 0, 0
    plugin_names = []

    # ARGUMENTS PARSER
    parser = ArgumentParser()
    parser.add_argument("-i", action="store_true",
                        help="Shows all the options of the classifier")
    parser.add_argument("-labeled_data", dest="labeled_data",
                        help="Path to the file with the labeled data to train")
    parser.add_argument("-unlabeled_data", dest="unlabeled_data",
                        help="Path to the file with the unlabeled data to classify (not required)")
    parser.add_argument("-labels", dest="labels", default=0,
                        help="List of labels in case of manual extraction")
    parser.add_argument("-classifiers", dest="classifiers", default=f"{NAIVE},{MAXENT},{FOREST},{SVM},{KNN},{TREE},{MLP}",
                        help="(NAIVE, MAXENT, FOREST, SVM, KNN, TREE, MLP) in 0s and 1s")
    parser.add_argument("-knn", dest="knn", default=KNN_N,
                        help="Number of neighbourhoods in the KNN algorithm")
    parser.add_argument("-pre", dest="pre", default="{},{},{}".format(STOP, STEAM, LEMMA),
                        help="(STOP WORDS, STEMMING, LEMMATIZATION) in 0s and 1s")
    parser.add_argument("-extraction", dest="extraction", default=NGRAMS,
                        help="(BIGRAMS, TRIGRAMS) none (0), bigrams (1) or trigrams (2)")
    parser.add_argument("-no_ratings", action="store_true",
                        help="The classifier does not use the reviews ratings")
    parser.add_argument("-param", dest="param", default="{},{},{}".format(TRAIN_SIZE, N_SPLITS, N_REPEATS),
                        help="(TRAIN_SIZE, N_SPLITS, N_REPEATS) one double and two integers")
    parser.add_argument("-plugins", dest="plugins",
                        help="Names of the used plugins in the given directory (all if not specified)")
    parser.add_argument("-plugins_path", dest="plugins_path", help="Path to plugins")
    parser.add_argument("-s", action="store_true",
                        help="For the interface: reading the data from stdin")
    parser.add_argument("-p", dest="p",
                        help="For the interface: giving all plugins in path")
    args = parser.parse_args()

    # ASSIGNATION OF ARGUMENTS TO GLOBAL VARIABLES

    # Info display - information about the usage of the tool is shown
    if args.i:
        show_info()
        if args.p:
            search_plugins(args.p)
        quit()

    if args.p:
        search_plugins(args.p)
        quit()

    # Label data - required unless its info display
    if not args.labeled_data and not args.s:
        raise Exception('No labeled data selected')

    if not args.s:
        # Checking whether the paths to the data files exist
        if not os.path.isfile(args.labeled_data) and not os.path.isfile(args.labeled_data + ".tsv"):
            raise Exception('The path to the labeled data does not exist', args.labeled_data)
        if args.unlabeled_data:
            if not os.path.isfile(args.unlabeled_data) and not os.path.isfile(args.unlabeled_data + ".tsv"):
                raise Exception('The path to the unlabeled data does not exist', args.labeled_data)

    # Reading the data files
    if args.s:
        # Input from stdin
        try:
            content = sys.stdin.read().encode('utf8', 'ignore').decode('utf8')
            splitContent = content.split("___xxx___")
            labeled = pd.read_csv(StringIO(splitContent[0]), sep='\t', encoding="utf-8")
            if splitContent[1] != "":
                unlabeled = pd.read_csv(StringIO(splitContent[1]), sep='\t', encoding="utf-8",
                                        names=['ID', 'Date', 'Review score', 'Review text', 'Sentiment'])
                MODE = 1  # labeling and comparing
        except:
            raise Exception('Error in the input of data from stdin')

    else:
        # Input from the files
        try:
            # Labeled file
            if args.labeled_data.endswith('.tsv'):
                labeled = pd.read_csv(args.labeled_data, sep='\t')
            else:
                labeled = pd.read_csv(args.labeled_data + ".tsv", sep='\t')
        except:
            raise Exception('Error in the format of the data file LABELED')

        try:
            # Unlabeled file if provided
            if args.unlabeled_data:
                if args.unlabeled_data.endswith('.tsv'):
                    unlabeled = pd.read_csv(args.unlabeled_data, sep='\t', names=['ID', 'Date', 'Review score',
                                                                                  'Review text', 'Sentiment'])
                else:
                    unlabeled = pd.read_csv(args.unlabeled_data + ".tsv", sep='\t',
                                            names=['ID', 'Date', 'Review score', 'Review text', 'Sentiment'])
                MODE = 1
        except:
            raise Exception('Error in the format of the data file UNLABELED')

    arg1 = args.classifiers.split(",")
    arg2 = args.pre.split(",")
    arg3 = args.param.split(",")
    labels = args.labels

    # - classifiers
    if len(arg1) is 7:
        try:
            NAIVE = int(arg1[0])
            MAXENT = int(arg1[1])
            FOREST = int(arg1[2])
            SVM = int(arg1[3])
            KNN = int(arg1[4])
            TREE = int(arg1[5])
            MLP = int(arg1[6])
        except (TypeError, ValueError):
            raise Exception('Classifiers parameter should have SEVEN binary (0 or 1) values separated by commas: (NAIVE, MAXENT, FOREST, SVM, KNN, TREE, MLP)')
    else:
        raise Exception('Classifiers parameter should have SEVEN binary (0 or 1) values separated by commas: (NAIVE, MAXENT, FOREST, SVM, KNN, TREE, MLP)')

    # - Preprocessing
    if len(arg2) is 3:
        try:
            STOP = int(arg2[0])
            STEAM = int(arg2[1])
            LEMMA = int(arg2[2])
        except (TypeError, ValueError):
            raise Exception('PRE parameter should have THREE binary (0 or 1) values separated by commas: (STOP, STEAM, LEMMA)')
    else:
        raise Exception('PRE parameter should have TREE binary (0 or 1) values separated by commas: (STOP, STEAM, LEMMA)')

    # - Bigrams and trigrams
    try:
        NGRAMS = int(args.extraction)
    except (TypeError, ValueError):
        raise Exception('EXTRACTION parameter should have ONE numeric value (0 - none, 1 - bigrams, 2 - trigrams)')

    if args.no_ratings:
        RATINGS = 0

    # - Training and Testing Parameters
    if len(arg3) is 3:
        try:
            TRAIN_SIZE = float(arg3[0])
            N_SPLITS = int(arg3[1])
            N_REPEATS = int(arg3[2])
        except (TypeError, ValueError):
            raise Exception('PARAM parameter should have THREE numeric values separated by commas (TRAIN_SIZE, N_SPLITS, N_REPEATS)')
    else:
        raise Exception('PARAM parameter should have THREE numeric values separated by commas (TRAIN_SIZE, N_SPLITS, N_REPEATS)')

    # - Number of neighbours
    if args.knn:
        try:
            KNN_N = int(args.knn)
        except (TypeError, ValueError):
            raise Exception('KNN should be an integer: number of neighbours')

    # - Labels (in case of manual input)
    if labels is not 0:
        try:
            labels = labels.split(",")
        except:
            raise Exception('Label parameter should have all the labels separated by commas: L1,L2,L3')

    # - Plugins
    if args.plugins:
        if not args.plugins_path:
            raise Exception('Plugins path missing')
        try:
            plugins_use = args.plugins.split(",")
        except:
            raise Exception('Plugins should be file names separated by commas: plugin1,plugin2,plugin3')

    if args.plugins_path:
        plugins_path = args.plugins_path
        if not args.plugins:
            plugins_use=0


# ---------------------------------------------------------------------------------------------

# General input comprobations
def check_args():
    if not (NAIVE == 0 or NAIVE == 1) or not (MAXENT == 0 or MAXENT == 1) or not (FOREST == 0 or FOREST == 1) or not (
            SVM == 0 or SVM == 1) or not (KNN == 0 or KNN == 1) or not (TREE == 0 or TREE == 1) or not (MLP == 0 or MLP == 1) or not (
            STEAM == 0 or STEAM == 1) or not (LEMMA == 0 or LEMMA == 1) or not (STOP == 0 or STOP == 1):
        raise Exception('Binary parameters are not binary (0 or 1) in classifiers and PRE parameters')

    if plugins_path is not 0 and not os.path.isdir(plugins_path):
        raise Exception('The path {} is not a valid directory of plugins'.format(plugins_path))

    if TRAIN_SIZE < 0.01 or TRAIN_SIZE > 0.99:
        raise Exception('Train size should be between 0.01 and 0.99')

    if N_REPEATS is 0 or N_REPEATS > 50:
        raise Exception('The number of repeats should be more than 0 and less than 50')

    if KNN_N < 0 or KNN_N > 50:
        raise Exception('The number of neighbours should be less or equal to 50')

    if NGRAMS is not 0 and NGRAMS is not 1 and NGRAMS is not 2:
        raise Exception('The NGRAMS should be 0, 1 or 2')


# ----------------------------------PREPROCESSING AND FEATURES EXTRACTION---------------------------------------------

# Stemmer helper
def stem_words(doc):
    stemmer = EnglishStemmer()  # Eliminates prefixes and suffixes
    analyzer = CountVectorizer().build_analyzer()
    return (stemmer.stem(w) for w in analyzer(doc))


# Lemmer helper
class LemmaTokenizer(object):
    def __init__(self):
        self.wnl = WordNetLemmatizer()

    def __call__(self, articles):
        return [self.wnl.lemmatize(t) for t in word_tokenize(articles)]


# Configuration of tfidf (term frequency - inverse document frequency)
# Usage of N-Grams, Stop Words, Stemming and Lemmatization
def preprocessing():
    global tfidf
    print("--------------------PREPROCESSING AND FEATURES EXTRACTION------------------")

    print("Reviews Ratings") if RATINGS else print("NO Reviews Ratings")

    # Use of Bigrams and Trigrams
    if NGRAMS is 2:
        ngrams = (1, 3)
        print("Trigrams")
    elif NGRAMS is 1:
        ngrams = (1, 2)
        print("Bigrams")
    else:
        ngrams = (1, 1)
        print("NO Bigrams or Trigrams")

    # Use of Stemming and Lemantization
    if LEMMA & STEAM & STOP:
        tfidf = TfidfVectorizer(tokenizer=LemmaTokenizer(), ngram_range=ngrams, strip_accents='unicode',
                                stop_words='english', analyzer=stem_words, sublinear_tf=True)
        print("Stop Words Removal\nStemming\nLemmatization")
    elif LEMMA & STEAM:
        tfidf = TfidfVectorizer(tokenizer=LemmaTokenizer(), ngram_range=ngrams, strip_accents='unicode',
                                analyzer=stem_words, sublinear_tf=True)
        print("Stemming\nLemmatization")
    elif LEMMA & STOP:
        tfidf = TfidfVectorizer(tokenizer=LemmaTokenizer(), ngram_range=ngrams, strip_accents='unicode',
                                stop_words='english', analyzer='word', sublinear_tf=True)
        print("Removing Stop Words\nLemmatization")
    elif LEMMA:
        tfidf = TfidfVectorizer(tokenizer=LemmaTokenizer(), ngram_range=ngrams, strip_accents='unicode',
                                analyzer='word', sublinear_tf=True)
        print("Lemmatization")
    elif STEAM & STOP:
        tfidf = TfidfVectorizer(ngram_range=ngrams, strip_accents='unicode', stop_words='english', analyzer=stem_words,
                                sublinear_tf=True)
        print("Stop Words Removal\nStemming")
    elif STEAM:
        tfidf = TfidfVectorizer(ngram_range=ngrams, strip_accents='unicode', stop_words='english', analyzer=stem_words,
                                sublinear_tf=True)
        print("Stemming")
    elif STOP:
        tfidf = TfidfVectorizer(ngram_range=ngrams, strip_accents='unicode',
                                stop_words='english', analyzer='word', sublinear_tf=True)
        print("Removing Stop Words")
    else:
        tfidf = TfidfVectorizer(ngram_range=ngrams, strip_accents='unicode', stop_words='english', sublinear_tf=True)
        print("NO Stop Words Removal, Stemming or Lemmatization")


# ---------------------------------------ALGORITHMS------------------------------------------------------

# Possible import of Plugin
def plugin_prep():
    print("----------------------------------PLUGINS----------------------------------")
    plugin_base = PluginBase(package='classification.plugins')

    plugin_source = plugin_base.make_plugin_source(searchpath=[plugins_path])
    print("From:", plugins_path)

    if plugins_use:     # Find all plugins given
        for plugin_name in plugins_use:
            plugin_names.append(plugin_name)
            print(plugin_name)
            try:
                plugin = plugin_source.load_plugin(plugin_name)
            except ModuleNotFoundError:
                raise Exception('Module name incorrect: {}'.format(plugin_name))
            classifiers.append((plugin_name, plugin.MyPlugin()))
    else:       # Find all plugins in directory
        for plugin_name in plugin_source.list_plugins():
            plugin_names.append(plugin_name)
            print(plugin_name)
            plugin = plugin_source.load_plugin(plugin_name)
            classifiers.append((plugin_name, plugin.MyPlugin()))

    #Checking structure
    for cl in classifiers:
        if not hasattr(cl[1], 'fit') or not hasattr(cl[1], 'predict'):
                raise Exception('The plugin \'{}\' does not contain the required attributes: fit and predict'.format(cl[0]))


# Choosing classification algorithms based on input
def classifiers_prep():
    global classifiers
    classifiers = []

    if plugins_path is not 0:
        plugin_prep()

    if NAIVE is not 0 or SVM is not 0 or MAXENT is not 0 or FOREST is not 0 or KNN is not 0 or TREE is not 0 or MLP is not 0:
        print("--------------------------------CLASSIFIERS--------------------------------")
    if NAIVE:
        bayes_clf = MultinomialNB()
        classifiers.append(('naive_bayes', bayes_clf))
        print("Naive Bayes")
    if SVM:
        svm_clf = SVC()
        classifiers.append(('svm', svm_clf))
        print("SVM")
    if MAXENT:
        maxent_clf = LogisticRegression()
        classifiers.append(('max_ent', maxent_clf))
        print("Maximum Entropy")
    if FOREST:
        forest_clf = RandomForestClassifier()
        classifiers.append(('random_forest', forest_clf))
        print("Random Forest")
    if KNN:
        knn_clf = KNeighborsClassifier(n_neighbors=KNN_N)
        classifiers.append(('knn', knn_clf))
        print("K-Nearest Neighbours -", KNN_N, "neighbours")
    if TREE:
        dtree_clf = tree.DecisionTreeClassifier()
        classifiers.append(('decision_tree', dtree_clf))
        print("Decision Tree")
    if MLP:
        mlp_clf = MLPClassifier()
        classifiers.append(('mlp', mlp_clf))
        print("Multi-layer Peception")

    if not classifiers:
        raise Exception('No algorithms selected')


# Automatically finding labels in the labeled data
def findLabels(data):
    global labels
    all_labels = data['Label']
    labels = []
    possible = []
    for l in all_labels:
        for j in l.split(","):
            possible.append(j.strip())
    c = Counter(possible)
    keys = c.keys()
    for key in keys:
        if "," not in key:
            labels.append(key)


# Remove prediction files if exist before starting a new classification
def removeFiles():
    for classif in classifiers:
        nameTotRes = "./results/total_" + str(classif[0]) + ".csv"
        path = Path(nameTotRes)
        if path.exists():
            remove(nameTotRes)


# ---------------------------------------CLASSIFICATION------------------------------------------------------

def classification():
    num_lines1 = len(labeled.index)

    print("-----------------------------------DATA------------------------------------")

    # Automatically fining labels in data
    if labels is 0:
        findLabels(labeled)
        print("Labels (automatically extracted):", labels)
    else:
        print("Labels (manually extracted):", labels)

    # Different information printing if predicting or not
    print("Labeled file:", num_lines1, "reviews")
    if MODE:
        num_lines2 = len(unlabeled.index)
        print("Unlabeled file:", num_lines2, "reviews")
        print("----------------------------------SCORES-----------------------------------")
        print("{:^7}{:^15}{:^5}{:^9}{:^9}{:^9}{:^9}{:^9}{:^15}{:^8}".format('Label', 'Class', 'Count', 'F1', 'Prec',
                                                                    'Rec', 'TestAcc', 'AuC', 'Pred_Pos', 'Pred_Neg'))
        print("-------------------------------------------------------------------------------------------------")
    else:
        print("Unlabeled file: not provided")
        print("----------------------------------SCORES-----------------------------------")
        print("{:^7}{:^15}{:^5}{:^9}{:^9}{:^9}{:^9}{:^9}".format('Label', 'Class', 'Count', 'F1', 'Prec', 'Rec',
                                                                 'TestAcc', 'AuC'))
        print("-----------------------------------------------------------------------")

    # Removing previous result files
    if MODE:
        removeFiles()


    # CLASSIFICATION PIPELINE

    for label in labels:
        has_label = labeled[labeled['Label'].str.contains(label)]
        not_has_label = labeled[np.logical_not(labeled['Label'].str.contains(label))]
        has_label.is_copy, has_label['Label'] = False, 'Positive'
        not_has_label.is_copy, not_has_label['Label'] = False, 'Negative'

        balanced = pd.concat([has_label, not_has_label.sample(len(has_label), replace=False)])
        balanced_train, balanced_test = train_test_split(balanced, train_size=TRAIN_SIZE)

        for classif in classifiers:

            if RATINGS:  # With reviews ratings
                # Review ratings
                p1 = Pipeline([
                    ('selector', ItemSelector(key='Review score')),
                    ('caster', ArrayCaster())
                ])

                #  TF-IDF
                p2 = Pipeline([
                    ('selector', ItemSelector(key='Review text')),
                    ('tfidf', tfidf)
                ])

                # Classification
                p = Pipeline([
                    ('features', FeatureUnion([
                        ('meta', p1),
                        ('body', p2)])
                     ),
                    ('class', classif[1])
                ])

            else:  # Without review ratings
                #  TF-IDF
                p1 = Pipeline([
                    ('selector', ItemSelector(key='Review text')),
                    ('tfidf', tfidf)
                ])

                # Classification
                p = Pipeline([
                    ('features', p1),
                    ('class', classif[1])
                ])


            # TRAINING
            try:
                p.fit(balanced_train, balanced_train["Label"])
            except ValueError:
                raise Exception('Error in fitting the models: The labels do not match the data')


            # PREDICTION OF UNLABELED DATA in ./results
            if MODE:
                if not os.path.exists('./results'):
                    os.makedirs('./results')

                results = p.predict(unlabeled)

                # ONE FILE PER CLASSIFIER AND LABEL

                # Only use probability predictions if the classifier offers the method 'predict_proba'

                if hasattr(p, 'predict_proba'):
                    probab = 1
                    results_proba_pos = p.predict_proba(unlabeled)[:, 1]
                else:
                    probab = 0
                # Change the binary predictions to 0s and 1s instead of 'Positive' and 'Negative'
                for i in range(0, num_lines2):
                    if results[i] == 'Positive':
                        results[i] = "1"
                    else:
                        results[i] = "0"

                # Write file headers
                name = "./results/result_" + str(label) + "_" + str(classif[0]) + ".csv"
                f = open(name, 'w')
                if probab:
                    writer = csv.DictWriter(f, fieldnames=['ID', 'Label', 'Probability'])
                else:
                    writer = csv.DictWriter(f, fieldnames=['ID', 'Label'])
                writer.writeheader()

                # Write file info (with or without probability measures)
                for i in range(0, len(unlabeled['ID'])):
                    if probab:
                        text = "%s , %s , %s\n" % (unlabeled['ID'][i], results[i], results_proba_pos[i])
                    else:
                        text = "%s , %s \n" % (unlabeled['ID'][i], results[i])
                    f.write(text)
                f.close()

                # ONE FILE PER CLASSIFIER WITH ALL LABELS

                nameTotRes = "./results/total_" + str(classif[0]) + ".csv"
                path = Path(nameTotRes)

                if not path.exists():  # Create file (first prediciton)
                    file = open(nameTotRes, 'w+')
                    lb = ['ID']
                    lb.extend(labels[::-1])
                    writer = csv.DictWriter(file, fieldnames=lb)
                    writer.writeheader()
                    for i in range(0, num_lines2):
                        if probab:
                            text = ", %s\n" % (results_proba_pos[i])
                        else:
                            text = ", %s\n" % (results[i])
                        file.write(text)
                    file.close()

                else:  # Update lines
                    data = open(nameTotRes, 'r').readlines()
                    if label == labels[-1]:
                        if probab:
                            output = ["%s %s, %s" % (data[i], unlabeled['ID'][i], results_proba_pos[i]) for i in
                                      list(range(0, num_lines2))]
                        else:
                            output = ["%s %s, %s" % (data[i], unlabeled['ID'][i], results[i]) for i in
                                  list(range(0, num_lines2))]
                    else:
                        if probab:
                            if type(results_proba_pos) == list:
                                output = ["%s, %s" % (data[i], results_proba_pos[i]) for i in list(range(0, num_lines2))]
                            else:
                                output = ["%s, %s" % (data[i], results_proba_pos.tolist()[i]) for i in
                                          list(range(0, num_lines2))]
                        else:
                            output = ["%s, %s" % (data[i], results[i]) for i in list(range(0, num_lines2))]

                    with open(nameTotRes, 'w') as f:
                        f.write(" ".join(output))
                        f.write(data[num_lines2])


            # TESTING WITH VALIDATION DATA
            # Cross validation
            scoring = {'f1': 'f1_macro',
                       'precision': 'precision_macro',
                       'recall': 'recall_macro',
                       'roc_auc': 'roc_auc'}

            try:
                scores = cross_validate(p,
                                balanced_train,
                                balanced_train["Label"],
                                scoring=scoring,
                                cv=RepeatedKFold(n_splits=N_SPLITS, n_repeats=N_REPEATS))
                roc = 1  # Use of probability estimations or not

            except (ValueError, AttributeError):
                scoring = {'f1': 'f1_macro',
                           'precision': 'precision_macro',
                           'recall': 'recall_macro'}
                roc = 0
                scores = cross_validate(p,
                                        balanced_train,
                                        balanced_train["Label"],
                                        scoring=scoring,
                                        cv=RepeatedKFold(n_splits=N_SPLITS, n_repeats=N_REPEATS))


            # Printing scores
            print("{:^7}{:^15}{:^5}".format(label, classif[0], len(has_label)), end='')
            for metric in scores.keys():
                if 'test_' in metric:
                    # f1, precision, recall
                    print("{:^9}".format(np.mean(scores[metric]).round(5)), end='')

            test_score = p.score(balanced_test, balanced_test["Label"])

            if MODE:
                pos = list(results).count("1")
                neg = num_lines2 - pos
                if roc:
                    print('{:^9}{:^15}{:^8}'.format(round(test_score, 5), pos, neg))
                else:
                    print('{:^9}{:^10}{:8}{:12}'.format(round(test_score, 5), "N/A", pos, neg))
            else:
                if roc:
                    print('{:^9}'.format(round(test_score, 5)))
                else:
                    print('{:^9}{:^10}'.format(round(test_score, 5),"N/A"))



# ---------------------------------------INTERFACE------------------------------------------------------

def show_info():
    print("Options of the Classifier:")
    print(
        "- Classifiers: Naive Bayes, Maximum Entropy, Random Forest, Support Vector Machine, K-Nearest Neighbours, "
        "Decision Tree, Multi-Layer Perceptron (NAIVE, MAXENT, FOREST, SVM, KNN, TREE, MLP)")
    print("- Preprocessing: Removal of Stop Words, Stemming, Lemmatization (STOP, STEAM, LEMMA)")
    print(
        "- Parameters: Split Size of the Training Data, Number of repeats of testing, Number of Splits in Cross "
        "Validation (TRAIN_SIZE, N_REPEATS, N_SPLITS)")
    print("- Features extraction: Bi-grams, Tri-grams (NGRAMS, NGRAMS)")


def search_plugins(path):
    for file in os.listdir(path):
        if file.endswith(".py"):
            print("+ "+ file)


# ---------------------------------------MAIN------------------------------------------------------

def main():
    warnings.filterwarnings("ignore", category=FutureWarning)
    warnings.filterwarnings("ignore", category=UndefinedMetricWarning)
    warnings.filterwarnings("ignore", category=ConvergenceWarning)

    arguments()
    check_args()
    preprocessing()
    classifiers_prep()
    classification()


if __name__ == "__main__":
    main()