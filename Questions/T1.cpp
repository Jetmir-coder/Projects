#include <iostream>
#include <fstream>
#include <string>
#include <list>
#include <unordered_map>
#include <limits>
#include <algorithm>
using namespace std;

// Funktion zum Laden der Frageliste aus einer Textdatei
void FragenDateiOpen(unordered_map<string, list<string>> &Frageliste)
{
    ifstream file("fragen.txt");
    if (file.is_open())
    {
        string line;
        while (getline(file, line))
        {
            size_t pos = line.find(':');
            if (pos != string::npos)
            {
                string frage = line.substr(0, pos);
                string antwortenStr = line.substr(pos + 1);
                list<string> antworten;
                size_t start = 0;
                size_t end;
                while ((end = antwortenStr.find('|', start)) != string::npos)
                {
                    antworten.push_back(antwortenStr.substr(start, end - start));
                    start = end + 1;
                }
                Frageliste[frage] = antworten;
            }
        }
        file.close();
    }
}

// Funktion zum Speichern der Frageliste in eine Textdatei
void FragenDateiSave(const unordered_map<string, list<string>> &Frageliste)
{
    ofstream file("fragen.txt");
    if (file.is_open())
    {
        for (const auto &pair : Frageliste)
        {
            file << pair.first << ":";
            for (const string &antwort : pair.second)
            {
                file << antwort << "|";
            }
            file << endl;
        }
        file.close();
        cout << "The Question has been added to the file!" << endl;
    }
}

// Funktion für die Eingabe einer Frage und Antworten und Speichern der Frage in die Frageliste
void Fragenhinzufügen(unordered_map<string, list<string>> &Frageliste)
{

    // Eingabe der Frage und der Antworten
    string input;
    cout << "Ruleset for adding a question!" << endl;
    cout << "The correct format for a question is as follows: question?\"answer1\" \"answer2\"\"answerX\". \n"
         << endl;
    cout << "For every question added there has to be at least one answer." << endl;
    cout << "Answers to a question can be added to an unlimited amout." << endl;
    cout << "One Question must have at least 4 character" << endl;
    cout << "Questions can have a max of 255 characters." << endl;
    cout << "One Answer must have at least 1 character" << endl;
    cout << "One Answer can have a max of 255 character." << endl;
    cout << "Add your Question: " << '\n';
    getline(cin, input);

    // Trennen der Eingabe in Frage und Antworten

    size_t pos = input.find('?');
    if (pos != string::npos)
    {
        // Überprüfung maximal 255 Zeichen
        string frage = input.substr(0, pos + 1); // +1, um das Fragezeichen einzuschließen
        if (frage.length() > 255)
        {
            cout << "The question must be no longer than 255 characters. Please shorten your question." << endl;
            return;
        }
        else if (frage.length() < 4)
        {
            cout << "A question must not be less than 4 character long. Please correct your question." << endl;
            return;
        }

        string antwortenStr = input.substr(pos + 1);
        // Anzahl der Anführungszeichen dadurch wird festgestellt ob die Antworten verarbeitet werden können
        if (count(antwortenStr.begin(), antwortenStr.end(), '"') % 2 != 0)
        {
            cout << "You forgot the quotation marks: \" in your input." << endl;
            return;
        }
        list<string> antworten;
        size_t start = 0;
        size_t end;
        while ((end = antwortenStr.find('"', start)) != string::npos)
        {
            start = end + 1;
            end = antwortenStr.find('"', start);
            if (end != string::npos)
            {
                string antwort = antwortenStr.substr(start, end - start);

                // Überprüfung der einzelnen Antworten die jeweils maximal 255 Zeichen haben dürfen
                if (antwort.length() > 255)
                {
                    cout << "An answer must be a maximum of 255 characters long. Please correct your answer." << endl;
                    return;
                }
                else if (antwort.length() == 0)
                {
                    cout << "An answer must not be less than 1 character long. Please correct your answer." << endl;
                    return;
                }
                antworten.push_back(antwort);
            }
            start = end + 1;
        }
        if (antworten.empty())
        {
            cout << "You must enter at least one response." << endl;
            return; // Wiederholen der Schleife bei fehlenden Antworten
        }
        // Einfügen der Frage und Antworten zur Frageliste
        Frageliste[frage] = antworten;

        FragenDateiSave(Frageliste);
    }
    else
    {
        cout << "Invalid input. Please enter the question in the correct format." << endl;
    }
}

bool Fragezeichenüberprüfung(const string &frage)
{
    int count = 0;
    for (char c : frage)
    {
        if (c == '?')
        {
            count++;
        }
    }
    return count == 1;
}
// Funktion zum Ausgeben der Antworten zu einer spezifischen Frage im Bulletpointformat
void Frage_Antworten(const unordered_map<string, list<string>> &Frageliste, const string &frage)
{
    cout << "The correct format for a question is as follows: question?" << endl;
    if (frage.back() != '?')
    {
        cout << "Please enter a valid question (end with '?')." << endl;
        return;
    }
    if (!Fragezeichenüberprüfung(frage))
    {
        cout << "Please enter only one question mark in the question." << endl;
        return;
    }
    auto it = Frageliste.find(frage);
    if (it != Frageliste.end())
    {
        cout << "Answer will be " << endl;
        for (const string &antwort : it->second)
        {
            cout << " - " << antwort << endl;
        }
    }
    else
    {
        cout << "the answer to life, universe and everything is 42" << endl;
    }
}

int main()
{
    unordered_map<string, list<string>> Frageliste;

    // Laden der Frageliste aus der Datei
    FragenDateiOpen(Frageliste);

    string spezifischeFrage;
    int choice;
    do
    {
        cout << "\nOptions:\n";
        cout << "1. Ask a Question  \n";
        cout << "2. Add a question and its answers\n";
        cout << "3. Exit\n";
        cout << "Enter your choice: ";
        while (!(cin >> choice)) // Überprüfe, ob die Eingabe ein Integer ist
        {
            cout << "Please enter only numbers: ";
            cin.clear();                                         // Setze den Fehlerzustand zurück
            cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Leere den Eingabepuffer
        }
        cin.ignore();
        switch (choice)
        {
        case 1:
            cout << "Could you please provide your question here: \n";
            getline(cin, spezifischeFrage);
            Frage_Antworten(Frageliste, spezifischeFrage);
            break;
        case 2:
            Fragenhinzufügen(Frageliste);
            break;
        case 3:
            break;
        default:
            cout << "This input is not accepted. Please try again.\n";
        }
    } while (choice != 3);

    return 0;
}
